const Hapi = require('@hapi/hapi');
const routes = require('./User/RoutesUser');

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost',
  });

  // Mendaftarkan routes
  server.route(routes);

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
