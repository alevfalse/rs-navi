const logger = require('../config/logger');

// get the database URI based on the MODE env variable
let uri = '';

switch(process.env.MODE)
{
    case 'prod': uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@rs-navi-zp6p4.mongodb.net/rs-navi?retryWrites=true`; break;
    case 'dev' : uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@rs-navi-zp6p4.mongodb.net/rs-navi-dev?retryWrites=true`; break;
    case 'local': uri = `mongodb://localhost:27017/rs-navi-local`; break;
    default:  
        logger.error(`Database URI: Environment variable MODE contains an invalid value.`);
        process.exit(1);
}

module.exports = uri;