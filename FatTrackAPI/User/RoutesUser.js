const handler = require('./HandlerUser');

const routes = [
  {
    method: 'POST',
    path: '/users',
    handler: async (request, h) => {
      try {
        const result = await handler.addUser(request.payload);
        return h.response({
          message: 'Data berhasil ditambahkan',
          id: result.id,
        }).code(201);
      } catch (err) {
        if (err.message.includes('wajib diisi')) {
          return h.response({ error: err.message }).code(400);
        }
        console.error('Error:', err);
        return h.response({ error: 'Terjadi kesalahan pada server' }).code(500);
      }
    },
  },
  {
    method: 'POST',
    path: '/users/{userId}/photo',
    options: {
      payload: {
        output: 'stream', // Menangani file sebagai stream
        parse: true,      // Memungkinkan parsing otomatis
        allow: 'multipart/form-data', // Hanya izinkan tipe multipart/form-data
        multipart: true,  // Aktifkan multipart parsing
        maxBytes: 5 * 1024 * 1024, // Batas ukuran file (5MB)
      },
    },
    handler: async (request, h) => {
      try {
        const { userId } = request.params;
        const file = request.payload.file; // Ambil file dari request

        if (!file || !file.hapi) {
          return h.response({ error: 'File tidak ditemukan' }).code(400);
        }

        const fileBuffer = file._data;
        const fileName = file.hapi.filename;

        const fileUrl = await handler.updateProfilePhoto(userId, fileBuffer, fileName);

        return h.response({
          message: 'Foto profil berhasil diperbarui',
          foto_profile: fileUrl,
        }).code(200);
      } catch (err) {
        console.error('Error:', err);
        return h.response({ error: 'Terjadi kesalahan pada server' }).code(500);
      }
    },
  },
  {
    method: 'GET',
    path: '/users',
    handler: async (request, h) => {
      try {
        const users = await handler.getAllUsers();
        return h.response(users).code(200);
      } catch (err) {
        console.error('Error:', err);
        return h.response({ error: 'Terjadi kesalahan pada server' }).code(500);
      }
    },
  },
  {
    method: 'GET',
    path: '/users/{userId}',
    handler: async (request, h) => {
      try {
        const { userId } = request.params;
        const user = await handler.getUserById(userId);

        if (!user) {
          return h.response({ error: 'User tidak ditemukan' }).code(404);
        }

        return h.response(user).code(200);
      } catch (err) {
        console.error('Error:', err);
        return h.response({ error: 'Terjadi kesalahan pada server' }).code(500);
      }
    },
  },
];

module.exports = routes;
