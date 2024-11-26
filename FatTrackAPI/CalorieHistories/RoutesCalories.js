const { getDailyCalories } = require('./HandlerCalories');

const routes = [
  {
    method: 'GET',
    path: '/calories/{userId}',
    handler: getDailyCalories,
  },
];

module.exports = routes;
