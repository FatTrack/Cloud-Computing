# API Aplikasi Deteksi Kalori pada Makanan
Api ini ini membantu pengguna mendeteksi jumlah kalori pada makanan berdasarkan gambar yang diunggah.
## Fitur
- Deteksi kalori berdasarkan gambar.
- Menyimpan riwayat makanan yang diprediksi.
- Menampilkan artikel tentang gizi dan kesehatan.

## Instalasi
1. Clone repository:
   ```bash
   git clone https://github.com/FatTrack/Cloud-Computing.git
   ```
2. Masuk ke direktori proyek:
   ```bash
   cd FatTrackAPI atau ml-api
   ```
3. Install dependencies:
   ```bash
   npm install / pip install requirements.txt
   ```
4. Jalankan aplikasi:
   ```bash
   npm run start / python main.py
   ```

## Penggunaan
1. Buka Postman.
2. Testing endpoint
3. Unggah gambar makanan.
4. Lihat hasil prediksi kalori dan gizi.

## Endpoint
1. Prediksi Gambar
   ```bash
   /predict_image
   ```
2. Pencarian Nama Makanan
   ```bash
   /makanan
   ```
##

3. Login
   ```bash
   /login
   ```
4. Register
   ```bash
   /register
   ```
5. Take data user
   ```bash
   /users/{userId}
   ```
6. Update Photo Profile User
   ```bash
   /photo
   ```
##
7. History Predict User menampilkan total kalori, protein, karbohidrat, lemak dalam 1 hari
   ```bash
   /home/histories/{userId}
   ```
8. History Predict User 3 hari (menampilkan seluruh prediksi user)
   ```bash
    /dashboard/check-history/three-days/{userId}
   ```
9. Menampilkan History total kalori user selama 7 hari
    ```bash
       /dashboard/seven-days/{userId}
    ```
10. Menampilkan data total kalori user selama 30 hari dengan kalkulasi per minggu
    ```bash
     /dashboard/thirty-days/{userId}
    ```
##
11. Artikel
    ```bash
    /articles
    ```
12. Artikel By ID
    ```bash
    /articles/{id}
    ```

## Lisensi
Proyek ini dilisensikan di bawah MIT License. Lihat [LICENSE](./LICENSE) untuk informasi lebih lanjut.


