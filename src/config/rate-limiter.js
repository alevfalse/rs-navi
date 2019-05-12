const MongoStore = require('rate-limit-mongo');
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    store: new MongoStore({ uri: require('../config/database') })
});

module.exports = limiter;