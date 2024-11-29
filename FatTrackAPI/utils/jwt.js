const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET_KEY; // Simpan secara aman

// Membuat token JWT
const createToken = (payload) => {
  return jwt.sign(payload, secretKey, { expiresIn: '30d' });
};

// Memverifikasi token JWT
const verifyToken = (token) => {
  try {
    return jwt.verify(token, secretKey);
  } catch (err) {
    throw new Error('Token tidak valid');
  }
};

module.exports = { createToken, verifyToken };