// HandlerUser.js
const { Firestore } = require('@google-cloud/firestore');
const admin = require('firebase-admin');
const path = require('path');

const keyFilePath = path.resolve(__dirname, '../firebase-service-account.json');

// Inisialisasi Firestore
const firestore = new Firestore({
  projectId: 'capstone-project-c242-ps030',
  keyFilename: keyFilePath,
});

const bucket = admin.storage().bucket();

// Tambah user baru
const addUser = async (payload) => {
  const { email, nama, password } = payload;

  if (!email || !nama || !password) {
    return {
      code: 400,
      status: 'Bad Request',
      data: { message: 'Semua field (email, nama, password) wajib diisi' },
    };
  }

  const docRef = firestore.collection('user').doc();
  await docRef.set({
    email,
    nama,
    password,
    createdAt: Firestore.Timestamp.now(),
  });

  return {
    code: 201,
    status: 'Created',
    data: {
      message: 'Registerasi berhasil', 
      id: docRef.id 
    },
  };
};

// Update foto profil user
const updateProfilePhoto = async (userId, fileBuffer, fileName) => {
  if (!userId || !fileBuffer || !fileName) {
    return {
      code: 400,
      status: 'Bad Request',
      data: { message: 'userId, fileBuffer, dan fileName wajib diisi' },
    };
  }

  const userDocRef = firestore.collection('user').doc(userId);
  const userDoc = await userDocRef.get();

  if (!userDoc.exists) {
    return {
      code: 404,
      status: 'Not Found',
      data: { message: `User dengan ID ${userId} tidak ditemukan` },
    };
  }

  // Ambil URL foto lama dari Firestore
  const userData = userDoc.data();
  const oldPhotoUrl = userData.foto_profile;

  // Hapus file lama dari Firebase Storage jika ada
  if (oldPhotoUrl) {
    const oldFilePath = oldPhotoUrl.split(`https://storage.googleapis.com/${bucket.name}/`)[1];
    const oldFile = bucket.file(oldFilePath);

    try {
      await oldFile.delete();
      console.log(`File lama (${oldPhotoUrl}) berhasil dihapus.`);
    } catch (err) {
      console.error('Gagal menghapus file lama:', err);
    }
  }

  // Unggah file baru
  const newFilePath = `user_profile_photos/${userId}/${fileName}`;
  const newFile = bucket.file(newFilePath);
  await newFile.save(fileBuffer, {
    metadata: {
      contentType: fileName.includes('.png') ? 'image/png' : 'image/jpeg', // Sesuaikan content type
    },
  });

  await newFile.makePublic();
  const newFileUrl = `https://storage.googleapis.com/${bucket.name}/${newFilePath}`;

  // Perbarui URL foto di Firestore
  await userDocRef.update({ foto_profile: newFileUrl });

  return {
    code: 200,
    status: 'Success',
    data: { foto_profile: newFileUrl },
  };
};


// Ambil semua user
const getAllUsers = async () => {
  const snapshot = await firestore.collection('user').get();

  if (snapshot.empty) {
    return {
      code: 404,
      status: 'Not Found',
      data: [],
    };
  }

  const users = snapshot.docs.map((doc) => {
    const userData = doc.data();
    
    // Hapus field password dari objek userData
    const { password, ...userWithoutPassword } = userData;

    return {
      id: doc.id,
      ...userWithoutPassword, // return data tanpa password
    };
  });

  return {
    code: 200,
    status: 'Success',
    data: users,
  };
};


// Ambil user berdasarkan ID
const getUserById = async (userId) => {
  const userDocRef = firestore.collection('user').doc(userId);
  const userDoc = await userDocRef.get();

  if (!userDoc.exists) {
    return {
      code: 404,
      status: 'Not Found',
      data: {},
    };
  }

  // Ambil data pengguna
  const userData = userDoc.data();

  // Hapus field password dari objek data
  const { password, ...userWithoutPassword } = userData;

  return {
    code: 200,
    status: 'Success',
    data: {
      id: userDoc.id,
      ...userWithoutPassword, // return data tanpa password
    },
  };
};

// Handler untuk login
const loginHandler = async (request, h) => {
  const { email, password } = request.payload;

  if (!email || !password) {
    return h.response({
      code: 400,
      status: 'Bad Request',
      data: { message: 'Email and password are required' }
    }).code(400);
  }

  try {
    const userQuery = await firestore.collection('user').where('email', '==', email).get();

    if (userQuery.empty) {
      return h.response({
        code: 401,
        status: 'Unauthorized', 
        data: { message: 'Invalid email or password' } 
      }).code(401);
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    if (userData.password !== password) {
      return h.response({
        code: 401,
        status: 'Unauthorized', 
        data: { message: 'Invalid email or password' } 
      }).code(401);
    }

    return h.response({
      code: 200,
      status: 'Success',
      data: {
        message: 'Login successful',
        user: {
          id: userDoc.id,
          name: userData.name,
          email: userData.email,
        }
      },
    }).code(200);
  } catch (err) {
    console.error('Error logging in:', err);
    return h.response({ message: 'Internal Server Error' }).code(500);
  }
};

module.exports = { addUser, updateProfilePhoto, getAllUsers, getUserById, loginHandler };