import os
import uvicorn
import traceback
import tensorflow as tf
import numpy as np
from PIL import Image
from google.cloud import firestore
from fastapi import FastAPI, Response, UploadFile, Form, Header, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime
import pytz  # Untuk menangani zona waktu
import firebase_admin
from firebase_admin import credentials, storage
import jwt  # Untuk validasi JWT
import uuid  # Untuk membuat nama file unik

# Secret key untuk JWT (harus sesuai dengan yang di backend Node.js)
SECRET_KEY = "3f5b2e8c1d9f4a6b7e2c5d8f1a3b6e9c2d7f4b1e5a8c3d6f9b2e7"  # Ganti dengan kunci rahasia Anda

# Security schema untuk Bearer Token
security = HTTPBearer()

# Fungsi untuk memverifikasi token JWT
def verify_jwt(token: str):
    try:
        # Decode token
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token telah kedaluwarsa")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token tidak valid")

# Dependency untuk mendapatkan user dari token
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials  # Ambil token dari Authorization header
    return verify_jwt(token)

# Load model menggunakan TensorFlow dari direktori lokal
model = tf.keras.models.load_model('./Model_final2.h5')
print("Model loaded successfully")

# Initialize Firebase Admin SDK
cred = credentials.Certificate('./firebase-service-account.json')
firebase_admin.initialize_app(cred, {
    'storageBucket': 'capstone-project-c242-ps030.firebasestorage.app'  # Ganti dengan bucket Firebase Anda
})

# Initialize FastAPI
app = FastAPI()

# Inisialisasi Firestore Client
db = firestore.Client.from_service_account_json('./firebase-service-account.json')

# Zona waktu yang diinginkan
timezone = pytz.timezone("Asia/Jakarta")

# Fungsi untuk mendapatkan data makanan dari Firestore
def get_food_data_from_firestore(food_name):
    try:
        food_ref = db.collection('makanan').document(food_name)
        food_doc = food_ref.get()
        if food_doc.exists:
            return food_doc.to_dict()
        else:
            return None
    except Exception as e:
        raise ValueError(f"Error fetching food data from Firestore: {e}")

# Fungsi preprocessing gambar
def preprocess_image(image, target_size=(224, 224)):
    try:
        img = Image.open(image).convert("RGB")  # Ubah gambar menjadi format RGB
        img = img.resize(target_size)  # Ubah ukuran gambar
        img_array = np.array(img) / 255.0  # Normalisasi nilai piksel ke [0, 1]
        return np.expand_dims(img_array, axis=0)  # Menambahkan dimensi batch
    except Exception as e:
        raise ValueError(f"Error during image preprocessing: {e}")

# Fungsi untuk menyimpan gambar ke Firebase Storage dan mendapatkan URL publik
def upload_image_to_firebase(image_file, user_id):
    try:
        # Reset stream file ke posisi awal
        image_file.file.seek(0)

        # Tentukan bucket Firebase dan path file
        bucket = storage.bucket()
        filename = f"prediction/{user_id}_{str(uuid.uuid4())}_{image_file.filename}"
        blob = bucket.blob(filename)

        # Upload file ke Firebase Storage
        blob.upload_from_file(image_file.file, content_type=image_file.content_type)

        # Membuat URL publik
        blob.make_public()
        return blob.public_url
    except Exception as e:
        raise ValueError(f"Error uploading image to Firebase Storage: {e}")

# Fungsi untuk menyimpan data hasil prediksi ke dalam dokumen user
def store_prediction_to_user(user_id, prediction_data):
    try:
        user_ref = db.collection('user').document(user_id)

        # Periksa apakah dokumen user ada
        user_doc = user_ref.get()
        if not user_doc.exists:
            raise ValueError(f"User dengan ID {user_id} tidak ditemukan")

        # Simpan data ke subkoleksi 'predictions'
        prediction_ref = user_ref.collection('predictions').add(prediction_data)
        print(f"Prediction berhasil disimpan dengan ID: {prediction_ref[1].id}")
    except ValueError as ve:
        print(f"User tidak ditemukan: {ve}")
        raise
    except Exception as e:
        print(f"Error storing prediction to user document: {e}")
        raise

# Endpoint untuk prediksi gambar dengan menyimpan ke dokumen user
@app.post("/predict_image")
async def predict_image(
    user: dict = Depends(get_current_user),  # Ambil data user dari token
    user_id: str = Form(...), 
    uploaded_file: UploadFile = None, 
    response: Response = None
):
    # Gunakan 'id' dari token, bukan 'user_id'
    if user.get("id") != user_id:
        response.status_code = 401
        return {
            "code": 401,
            "status": "error",
            "data": {"message": "User ID tidak sesuai dengan token"}
        }

    # Memeriksa tipe file gambar
    if uploaded_file.content_type not in ["image/jpeg", "image/png", "image/jpg", "image/bmp"]:
        response.status_code = 400
        return {
            "code": 400,
            "status": "error",
            "data": {"message": "File is not a valid image (JPEG, JPG, PNG required)"}
        }

    try:
        # Mengonversi file gambar menjadi numpy array
        image_data = preprocess_image(uploaded_file.file)
        print("Image shape:", image_data.shape)

        # Melakukan prediksi menggunakan model
        prediction = model.predict(image_data)
        
        # Melakukan prediksi kelas
        class_labels = ["bakso", "bubur_ayam", "lontong_balap", "martabak_telur", 
                        "nasi_goreng", "pempek", "rawon", "rendang", "rujak_cingur", 
                        "telur_balado", "telur_dadar"]  # Label makanan
        predicted_class = class_labels[np.argmax(prediction)]  # Menentukan kelas dengan probabilitas tertinggi
        confidence = float(np.max(prediction))  # Mengambil nilai probabilitas tertinggi

        # Validasi confidence
        if confidence < 0.90:
            response.status_code = 400
            return {
                "code": 400,
                "status": "error",
                "data": {"message": "Tingkat kepercayaan terhadap gambar tidak cukup, mohon kirim gambar lain"}
            }

        # Mendapatkan informasi nutrisi dari Firestore
        food_info = get_food_data_from_firestore(predicted_class)
        if not food_info:
            response.status_code = 400
            return {
                "code": 400,
                "status": "error",
                "data": {"message": "Data nutrisi untuk makanan ini tidak tersedia"}
            }

        # Upload gambar ke Firebase Storage
        image_url = upload_image_to_firebase(uploaded_file, user_id)

        # Data yang akan disimpan
        prediction_data = {
            "predicted_class": predicted_class,
            "confidence": confidence,
            "nutritional_info": food_info,
            "image_url": image_url,  # Tambahkan URL gambar
            "createdAt": datetime.now(pytz.timezone("Asia/Jakarta"))  # Timestamp sebagai datetime
        }

        # Menyimpan hasil prediksi ke Firestore (dokumen user)
        try:
            store_prediction_to_user(user_id, prediction_data)
        except ValueError as ve:
            response.status_code = 404
            return {
                "code": 404,
                "status": "error",
                "data": {"message": str(ve)}
            }
        except Exception as e:
            response.status_code = 500
            return {
                "code": 500,
                "status": "error",
                "data": {"message": "Terjadi kesalahan saat menyimpan data prediksi"}
            }

        return {
            "code": 200,
            "status": "success",
            "data": prediction_data
        }

    except Exception as e:
        print(f"Error during prediction process: {e}")
        response.status_code = 500
        return {
            "code": 500,
            "status": "error",
            "data": {"message": "Terjadi kesalahan saat memproses gambar"}
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
