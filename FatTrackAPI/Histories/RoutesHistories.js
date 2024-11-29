const { getAllHistoryin3Days, getHistoryin7Days, getHistoryin30Days } = require("./HandlerHistories");
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
  {
    method: "GET",
    path: "/dashboard/check-history/three-days/{userId}",
    options: {
        pre: [{ method: validateToken }], // Middleware validasi token
      },
    handler: getAllHistoryin3Days,
  },
  {
    method: "GET",
    path: "/dashboard/seven-days/{userId}",
    options: {
        pre: [{ method: validateToken }], // Middleware validasi token
      },
    handler: getHistoryin7Days,
  },
  {
    method: "GET",
    path: "/dashboard/thirty-days/{userId}",
    options: {
        pre: [{ method: validateToken }], // Middleware validasi token
      },
    handler: getHistoryin30Days,
  },
];

module.exports = routes;
