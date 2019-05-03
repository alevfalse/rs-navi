const logger = require('../config/logger');

/**
 * @description A middleware that checks for html tags in the request parameters and body
 */
function sanitizer(req, res, next) {
    console.time('Passed');
    logger.info(`\nSanitizing: ${req.originalUrl}`);

    for (let prop in req.params) {
        req.params[prop] = req.params[prop].trim();

        if (req.params[prop].match(/<.*>|\$/s)) {

            const warning = `HTML Tag/NoSQL Operator detected: [${req.params[prop]}] ${req.originalUrl} - ${req.ip} `
            + `${req.user ? `${req.user._id}` : 'Anonymous'}`;
            logger.warn(warning);
            
            return next();
        }
    }

    for (let prop in req.body) {
        req.body[prop] = req.body[prop].trim();

        if (req.body[prop].match(/<.*>|\$/s)) {
            
            const warning = `HTML Tag/NoSQL Operator detected: [${req.body[prop]}] ${req.originalUrl} - ${req.ip} `
            + `${req.user ? `${req.user._id}` : 'Anonymous'}`;
            logger.warn(warning);

            return next();
        }
    }

    console.timeEnd('Passed');
    next();
}

module.exports = sanitizer;