const handler = require('./HandlerUser');
const { verifyToken } = require('../utils/jwt');

// Middleware untuk validasi token JWT
const validateToken = (request, h) => {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return h
      .response({
        code: 401,
        status: 'Unauthorized',
        data: { message: 'Token tidak disediakan' },
      })
      .takeover()
      .code(401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    request.auth = decoded; // Simpan payload JWT di `request.auth`
    return h.continue;
  } catch (err) {
    return h
      .response({
        code: 401,
        status: 'Unauthorized',
        data: { message: 'Token tidak valid' },
      })
      .takeover()
      .code(401);
  }
};

const routes = [
  // Tambah user
  {
    method: 'POST',
    path: '/register',
    handler: async (request, h) => {
      try {
        const response = await handler.addUser(request.payload);
        return h.response(response).code(response.code);
      } catch (err) {
        console.error('Error:', err);
        return h.response({
          code: 500,
          status: 'Internal Server Error',
          data: { message: 'Terjadi kesalahan pada server' },
        }).code(500);
      }
    },
  },

  // Login user
  {
    method: 'POST',
    path: '/login',
    handler: async (request, h) => {
      try {
        const response = await handler.loginHandler(request.payload); // Panggil login handler
        return h.response(response).code(response.code);
      } catch (err) {
        console.error('Error:', err);
        return h.response({
          code: 500,
          status: 'Internal Server Error',
          data: { message: 'Terjadi kesalahan pada server' },
        }).code(500);
      }
    },
  },

  // Ambil user berdasarkan ID
  {
    method: 'GET',
    path: '/users/{userId}',
    options: {
      pre: [{ method: validateToken }], // Middleware validasi token
    },
    handler: async (request, h) => {
      try {
        const { userId } = request.params;
        const response = await handler.getUserById(userId);
        return h.response(response).code(response.code);
      } catch (err) {
        console.error('Error:', err);
        return h.response({
          code: 500,
          status: 'Internal Server Error',
          data: { message: 'Terjadi kesalahan pada server' },
        }).code(500);
      }
    },
  },

  // Update profile
  {
    method: 'POST',
    path: '/updateProfile',
    options: {
      pre: [{ method: validateToken }],
      payload: {
        output: 'stream',
        parse: true,
        allow: 'multipart/form-data',
        multipart: true,
        maxBytes: 5 * 1024 * 1024,
      },
    },
    handler: async (request, h) => {
      try {
        const { userId, file, newName } = request.payload;
  
        let fileBuffer = null;
        let fileName = null;
  
        if (file && file.hapi) {
          fileBuffer = file._data;
          fileName = file.hapi.filename;
        }
  
        const response = await handler.updateProfile(userId, fileBuffer, fileName, newName);
        return h.response(response).code(response.code);
      } catch (err) {
        console.error('Error:', err);
        return h.response({
          code: 500,
          status: 'Internal Server Error',
          data: { message: 'Terjadi kesalahan pada server' },
        }).code(500);
      }
    },
  }
  
];

module.exports = routes;
