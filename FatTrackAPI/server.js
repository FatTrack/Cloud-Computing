const Hapi = require('@hapi/hapi');
const fs = require('fs');
const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

const serviceAccountKey = require('./firebase-service-account.json');

const init = async () => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountKey),
      storageBucket: 'capstone-project-c242-ps030.firebasestorage.app',
    });
  }

  const server = Hapi.server({
    port: 3000,
    host: '0.0.0.0',  // Ubah dari 'localhost' menjadi '0.0.0.0'
  });

  // Memuat semua rute dari folder yang relevan
  const routesFolders = ['./User', './SearchFood', './CalorieHistories',
                        './Histories', './Article', './ForgotPassword'];

  routesFolders.forEach((folder) => {
    const files = fs.readdirSync(path.resolve(__dirname, folder));
    files.forEach((file) => {
      if (file.startsWith('Routes') && file.endsWith('.js')) {
        const routes = require(path.resolve(__dirname, folder, file));
        server.route(routes);
      }
    });
  });

  // Menjalankan server
  await server.start();
  console.log('Server berjalan pada %s', server.info.uri);
};

// Menangani error yang tidak terduga
process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

init();
