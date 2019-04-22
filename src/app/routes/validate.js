const validateRouter = require('express').Router();

// model
const Account = require('../models/account');

validateRouter.get('/email', (req, res) => {

    const inputEmail = req.query.email;
    const roleString = req.query.role;

    if (!inputEmail || !roleString) { return res.send('2'); }

    let role;

    switch(roleString)
    {
        case 'student':     role = 0; break;
        case 'placeowner':  role = 1; break;
        default: return res.send('2');
    }
    
    Account.findOne({ 'email': inputEmail, 'role': role }, '_id',
    (err, account) => { err ? res.send('0') : account ? res.send('0') : res.send('1'); });
});

module.exports = validateRouter;
