const logger = require('../config/logger');

function undef(x) {
    return typeof x === 'undefined';
}

module.exports = function() {
    let valid = true;

    if (undef(process.env.PORT)) {
        logger.warn(`The PORT environment variable is not set in your environment file (.env).`);
    }

    if (undef(process.env.MODE)) {
        valid = false;
        logger.error(`The MODE environment variable is not set in your environment file (.env). Set it to 'dev' or 'local' during development, testing or staging.\n`
            + `Set it to 'prod' during production or official release of the application.`);
    } else if (process.env.MODE !== 'dev' && process.env.MODE !== 'prod' && process.env.MODE !== 'local') {
        valid = false;
        logger.error(`The MODE environment variable is set to an invalid value. Valid values are 'dev', 'prod', or 'local' without the single quotes.`);
    }

    if (undef(process.env.SESSION_SECRET)) {
        valid = false;
        logger.error(`The SESSION_SECRET environment variable is not set in your environment file (.env).`);
    }

    if (undef(process.env.ADMIN_SESSION_SECRET)) {
        valid = false;
        logger.error(`The ADMIN_SESSION_SECRET environment variable is not set in your environment file (.env).`);
    }

    if (undef(process.env.HASH_CODE_SALT)) {
        valid = false;
        logger.error(`The HASH_CODE_SALT environment variable is not set in your environment file (.env).`);
    }

    if (undef(process.env.MONGODB_USERNAME)) {
        valid = false;
        logger.error(`The MONGODB_USERNAME environment variable is not set in your environment file (.env).`);
    }

    if (undef(process.env.MONGODB_PASSWORD)) {
        valid = false;
        logger.error(`The MONGODB_PASSWORD environment variable is not set in your environment file (.env).`);
    }

    if (undef(process.env.RSNAVI_GMAIL_PASSWORD)) {
        valid = false;
        logger.error(`The RSNAVI_GMAIL_PASSWORD environment variable is not set in your environment file (.env).`);
    }

    return valid;
}
