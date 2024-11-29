const HandlerArticle = require("./HandlerArticle");
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

const RoutesArticle = [
  {
    method: "GET",
    path: "/articles",
    options: {
        pre: [{ method: validateToken }], // Middleware validasi token
      },
    handler: HandlerArticle.getAllArticles,
  },
  {
    method: "GET",
    path: "/articles/{id}",
    options: {
        pre: [{ method: validateToken }], // Middleware validasi token
      },
    handler: HandlerArticle.getArticleById,
  },
];

module.exports = RoutesArticle;
