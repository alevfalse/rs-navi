const validateRouter = require('express').Router();

// models
const Student = require('../models/student');
const Placeowner = require('../models/placeowner');

validateRouter.get('/email', (req, res) => {

    const inputEmail = req.query.email;
    const role = req.query.role;

    if (!inputEmail || !role) {
        console.log('Missing required field(s) in Email Validation.');
        return res.send(false);
    }

    switch (role.toLowerCase())
    {
    case 'student':
        process.nextTick(() => {

            Student.findOne({ 'account.email': inputEmail }, { 'email': 1}, (err, foundEmail) => {
                if (err) {
                    console.error(err);
                    return res.send(false);
                }
    
                if (foundEmail) { res.send(false); }
                else { res.send(true); }
            });
        });
        break;

    case 'placeowner':
        process.nextTick(() => {

            Placeowner.findOne({ 'account.email': inputEmail }, { 'email': 1}, (err, foundEmail) => {
                if (err) {
                    console.error(err);
                    return res.send(false);
                }
    
                if (foundEmail) { return res.send(false); }
                else { return res.send(true); }
            });
        });
        break;

    default:
        return res.send(false);
    }
})

validateRouter.get('/*', (req, res) => {
    return res.sendStatus(404);
})

module.exports = validateRouter;