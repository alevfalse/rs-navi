const validateRouter = require('express').Router();
const Account = require('../models/account');

validateRouter.get('/email', (req, res, next) => {
    const email = req.query.email;

    Account.findOne({ 'email': email }, function(err, account) {
        if (err) {
            console.log(err);
        }

        if (account) {
            return res.send(false);
        } else {
            res.send(true);
        }
    })
})

module.exports = validateRouter;