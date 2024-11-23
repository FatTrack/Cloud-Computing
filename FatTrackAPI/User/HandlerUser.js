const { Firestore } = require('@google-cloud/firestore');
const admin = require('firebase-admin');
// Inisialisasi Firestore
const firestore = new Firestore({
  projectId: 'capstone-project-c242-ps030',
  keyFilename: '../firebase-service-account.json' // Ganti path ini dengan path file JSON kredensial Anda
});

const addUser = async (payload) => {
  const { email, nama, password } = payload;

  // Validasi input
  if (!email || !nama || !password) {
    throw new Error('Semua field (email, nama, password) wajib diisi');
  }

  // Menambahkan data ke Firestore dengan auto-ID
  const docRef = firestore.collection('user').doc();
  await docRef.set({
    email,
    nama,
    password,
    createdAt: Firestore.Timestamp.now(),
  });

  return { id: docRef.id };
};

// Inisialisasi Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert('../firebase-service-account.json'), // Path ke file JSON kredensial Anda
  storageBucket: 'capstone-project-c242-ps030.firebasestorage.app', // Ganti dengan bucket name Anda
});

const bucket = admin.storage().bucket();

// Fungsi untuk mengupdate foto_profile
const updateProfilePhoto = async (userId, fileBuffer, fileName) => {
  if (!userId || !fileBuffer || !fileName) {
    throw new Error('userId, fileBuffer, dan fileName wajib diisi');
  }

  // Path file di Storage
  const filePath = `user_profile_photos/${userId}/${fileName}`;

  // Upload file ke Firebase Storage
  const file = bucket.file(filePath);
  await file.save(fileBuffer, {
    metadata: {
      contentType: 'image/png', // Sesuaikan dengan jenis file
    },
  });

  // Mengatur akses publik ke file
  await file.makePublic();

  // Mendapatkan URL file yang diunggah
  const fileUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

  // Update field foto_profile di Firestore
  const userDocRef = firestore.collection('user').doc(userId);
  const userDoc = await userDocRef.get();

  if (!userDoc.exists) {
    throw new Error(`User dengan ID ${userId} tidak ditemukan`);
  }

  await userDocRef.update({ foto_profile: fileUrl });

  return fileUrl;
};


const getAllUsers = async () => {
  const snapshot = await firestore.collection('user').get();

  if (snapshot.empty) {
    return [];
  }

  const users = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  return users;
};

const getUserById = async (userId) => {
  const userDocRef = firestore.collection('user').doc(userId);
  const userDoc = await userDocRef.get();

  if (!userDoc.exists) {
    return null;
  }

  return {
    id: userDoc.id,
    ...userDoc.data(),
  };
};

module.exports = { addUser, updateProfilePhoto, getAllUsers, getUserById };
