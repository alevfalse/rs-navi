const logger = require('../config/logger');

module.exports = function(err, req, res, next) {

    // status defaults to 500 when none is explicitly provided to the error
    res.status(err.status || 500);

    let title, message;

    switch (res.statusCode)
    {
        case 401: {
            title = '401 Unauthorized';
            message = 'You are not logged in.';
        } break;

        // logged in but denied access
        case 403: {
            title = '403 Forbidden';
            message = 'Not for your eyes.';
        } break;

        case 404: {
            title = '404 Not Found';
            message = 'Sorry, we could\'t find the page you are looking for.';
        } break;

        default: { // status 500
            logger.error(err.stack);
            title = '500 Internal Server Error T_T';
            message = 'Something went wrong. Our lazy devs are onto it.';
        }
    }

    res.render('error', { 'title': title, 'message': message },
    (err, html) => err ? logger.error(err.stack) : res.send(html));
}
