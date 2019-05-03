const validateRouter = require('express').Router();
const logger = require('../../config/logger');

const User = require('../models/user');

validateRouter.get('/email', (req, res, next) => {

    const email = req.query.email;

    if (!email || email.match(/<.*>|\$/s)) { return res.send('2'); }

    // TODO: Test $
    User.findOne({ 'account.email': email }, '_id', (err, user) => {
        if (err) { logger.error(err); }
        user ? res.send('0') : res.send('1');
    });
});

/* response codes
0 - taken
1 - available
2 - invalid email
*/

module.exports = validateRouter;
