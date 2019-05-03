const database = require('./database');
const mongoose = require('mongoose');
const logger = require('../config/logger');

const mode = process.env.MODE;

let uri;

switch (mode)
{
    case 'dev':   uri = database.devURI;   break;
    case 'prod':  uri = database.prodURI;  break;
    case 'local': uri = database.localURI; break;
    default: {
        logger.error('Invalid MODE environment variable value.');
        process.exit(1);
    }
}

// TODO: https://mongoosejs.com/docs/guide.html#options

// create a default mongoose connection
const connection = mongoose.connect(uri, { 
    useNewUrlParser: true, 
    useCreateIndex: true, 
    useFindAndModify: true 
});

logger.info(`Connecting to database: ${uri}`);

module.exports = connection;
