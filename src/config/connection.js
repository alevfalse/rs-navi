const dbURI = require('./database');
const mongoose = require('mongoose');
const logger = require('../config/logger');

// TODO: https://mongoosejs.com/docs/guide.html#options

// create a default mongoose connection
const connection = mongoose.connect(dbURI, { 
    useNewUrlParser: true, 
    useCreateIndex: true, 
    useFindAndModify: true 
});

logger.info(`Connecting to database: ${dbURI}`);

module.exports = connection;
