const logger = require('../config/logger');

module.exports = function(err, req, res, next) {
    res.status(err.status || 500);
    let title, message;

    switch (res.statusCode)
    {
        case 401: {
            title = '401 Unauthorized';
            message = 'You are not logged in.';
        } break;

        case 403: {
            title = '403 Forbidden';
            message = 'Not for your eyes.';
        } break;

        case 404: {
            title = '404 Not Found';
            message = 'Sorry, we could\'t find the page you are looking for.';
        } break;

        default: { // status 500
            logger.error(err);
            title = '500 Internal Server Error T_T';
            message = 'Something went wrong. Our lazy devs are onto it.';
        }
    }

    res.render('error', { 'title': title, 'message': message });
}
