const { Firestore } = require('@google-cloud/firestore');
const admin = require('firebase-admin');
const path = require('path');
const { createToken } = require('../utils/jwt');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const nodemailer = require('nodemailer');

const keyFilePath = path.resolve(__dirname, '');// Service Account Key
// Inisialisasi Firestore
const firestore = new Firestore({
  projectId: '', // Project ID Google Cloud
  keyFilename: keyFilePath,
});

const bucket = admin.storage().bucket();

// Konfigurasi Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // Gunakan layanan email yang sesuai
  auth: {
    user: '', // Email pengirim
    pass: '', // Password atau App Password
  },
});

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

  try {
    // Cek apakah email sudah digunakan di Firebase Authentication
    const userQuery = await admin.auth().getUserByEmail(email).catch((err) => {
      if (err.code === 'auth/user-not-found') return null; // User belum terdaftar
      throw err; // Error lainnya
    });

    if (userQuery) {
      return {
        code: 400,
        status: 'Bad Request',
        data: { message: 'Email sudah digunakan. Gunakan email lain' },
      };
    }

    // Buat user di Firebase Authentication
    const authUser = await admin.auth().createUser({
      email,
      password, // Simpan password asli di Firebase Authentication
      displayName: nama,
    });

    // Kirim email verifikasi
    const verificationLink = await admin.auth().generateEmailVerificationLink(email);

    const mailOptions = {
      from: '',
      to: email,
      subject: 'Verify your email for Fat Track',
      html: `<p>Hello ${nama},</p>
             <p>Thank you for signing up. Click the link below to verify your email:</p>
             <a href="${verificationLink}">${verificationLink}</a>
             <p>If you didn’t ask to verify this address, you can ignore this email.</p>
             <p>Thanks,</p>
             <p>Your Fat Track team</p>`,
    };

    await transporter.sendMail(mailOptions);

    // Simpan data user ke Firestore
    const docRef = firestore.collection('user').doc(authUser.uid);
    await docRef.set({
      email,
      nama,
      createdAt: Firestore.Timestamp.now(),
      emailVerified: false, // Tambahkan flag email verifikasi
    });

    return {
      code: 201,
      status: 'Created',
      data: {
        message: 'Registrasi berhasil. Silakan cek email untuk verifikasi.',
        id: authUser.uid,
      },
    };
  } catch (error) {
    console.error('Error registering user:', error);
    return {
      code: 500,
      status: 'Internal Server Error',
      data: { message: 'Terjadi kesalahan saat registrasi' },
    };
  }
};

const updateProfile = async (userId, fileBuffer, fileName, newName) => {
  if (!userId) {
    return {
      code: 400,
      status: 'Bad Request',
      data: { message: 'userId wajib diisi' },
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

  const updates = {};

  // Jika ada file foto baru, lakukan proses unggah dan perbarui URL
  if (fileBuffer && fileName) {
    const userData = userDoc.data();
    const oldPhotoUrl = userData.foto_profile;

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

    const randomId = uuidv4();
    const fileExtension = fileName.split('.').pop();
    const newFileName = `${randomId}.${fileExtension}`;
    const newFilePath = `user_profile_photos/${userId}/${newFileName}`;
    const newFile = bucket.file(newFilePath);
    await newFile.save(fileBuffer, {
      metadata: {
        contentType: fileName.includes('.png') ? 'image/png' : 'image/jpeg',
      },
    });

    await newFile.makePublic();
    const newFileUrl = `https://storage.googleapis.com/${bucket.name}/${newFilePath}`;
    updates.foto_profile = newFileUrl;
  }

  // Jika ada nama baru, tambahkan ke pembaruan
  if (newName) {
    updates.nama = newName;
  }

  // Jika tidak ada data yang diperbarui, kembalikan respons gagal
  if (Object.keys(updates).length === 0) {
    return {
      code: 400,
      status: 'Bad Request',
      data: { message: 'Tidak ada data untuk diperbarui' },
    };
  }

  // Perbarui data pengguna di Firestore
  await userDocRef.update(updates);

  return {
    code: 200,
    status: 'Success',
    data: {
      id: userId,
      message: `Data ${updates.foto_profile ? 'foto profil' : 'nama'} ${updates.nama ? `${updates.nama}` : ''} berhasil diperbarui`,
      updates
    },
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
const loginHandler = async (payload) => {
  const { email, password } = payload;

  if (!email || !password) {
    return {
      code: 400,
      status: 'Bad Request',
      data: { message: 'Email dan password wajib diisi' },
    };
  }

  try {
    // Firebase Authentication REST API URL untuk login
    const apiKey = 'AIzaSyB2juMSr7aOCL-kZVjAqzSuJrLN9R8DTpc';
    const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    const getUserUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;

    // Request body untuk login
    const signInRequestBody = {
      email,
      password,
      returnSecureToken: true,
    };

    // Kirim request login ke Firebase Authentication REST API
    const signInResponse = await axios.post(signInUrl, signInRequestBody);
    const idToken = signInResponse.data.idToken;

    // Gunakan idToken untuk mendapatkan informasi user
    const userInfoResponse = await axios.post(getUserUrl, { idToken });
    const userInfo = userInfoResponse.data.users[0];

    // Periksa apakah email telah diverifikasi
    if (!userInfo.emailVerified) {
      return {
        code: 403,
        status: 'Forbidden',
        data: {
          message: 'Email Anda belum diverifikasi. Silakan cek email untuk melakukan verifikasi.',
        },
      };
    }

    // Ambil data pengguna dari Firestore (jika diperlukan)
    const userQuery = await firestore.collection('user').where('email', '==', email).get();
    const userDoc = userQuery.docs[0];
    const userData = userDoc ? userDoc.data() : null;

    // Buat token JWT untuk sesi
    const token = createToken({ id: userDoc.id, email: userData.email });

    return {
      code: 200,
      status: 'OK',
      data: {
        message: 'Login berhasil',
        id: userDoc.id,
        token,
      },
    };
  } catch (error) {
    console.error('Error logging in user:', error.response?.data || error.message);
    return {
      code: 401,
      status: 'Unauthorized',
      data: { message: 'Email atau password salah' },
    };
  }
};

module.exports = { addUser, updateProfile, getAllUsers, getUserById, loginHandler };
