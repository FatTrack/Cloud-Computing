const { searchFoodHandler } = require('./HandlerSearch');

const searchRoutes = [
    {
        method: 'GET',
        path: '/makanan',
        handler: searchFoodHandler,
    },
];

module.exports = searchRoutes;
