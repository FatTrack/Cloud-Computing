const { forgotPasswordHandler } = require('./HandlerForgot');

const RoutesForgot = [
  {
    method: 'POST',
    path: '/forgot-password',
    handler: forgotPasswordHandler,
  },
];

module.exports = RoutesForgot;
