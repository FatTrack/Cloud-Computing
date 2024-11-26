const handler = require('./HandlerUser');

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
    handler: handler.loginHandler,
  },

  // Ambil semua user
  {
    method: 'GET',
    path: '/users',
    handler: async (request, h) => {
      try {
        const response = await handler.getAllUsers();
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

  // Update foto profil
  {
    method: 'POST',
    path: '/photo',
    options: {
      payload: {
        output: 'stream',
        parse: true,
        allow: 'multipart/form-data',
        multipart: true,
        maxBytes: 5 * 1024 * 1024, // Batas ukuran file (5MB)
      },
    },
    handler: async (request, h) => {
      try {
        // Ambil userId dari body form-data
        const { userId, file } = request.payload;
  
        if (!userId) {
          return h.response({
            code: 400,
            status: 'Bad Request',
            data: { message: 'userId wajib diisi' },
          }).code(400);
        }
  
        if (!file || !file.hapi) {
          return h.response({
            code: 400,
            status: 'Bad Request',
            data: { message: 'File tidak ditemukan' },
          }).code(400);
        }
  
        const fileBuffer = file._data;
        const fileName = file.hapi.filename;
  
        const response = await handler.updateProfilePhoto(userId, fileBuffer, fileName);
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
