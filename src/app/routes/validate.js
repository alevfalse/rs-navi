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

    switch (role)
    {
    case 'student':
        Student.findOne({ 'account.email': inputEmail }, { 'email': 1}, (err, foundEmail) => {
            if (err) {
                console.error(`An error occurred while validating student email [${inputEmail}]:\n${err}`);
                return res.send(false);
            }

            if (foundEmail) {
                console.log(`Found Student Email: ${foundEmail}`);
                res.send(false);
            } else {
                res.send(true);
            }
        })
        break;

    case 'placeowner':
        Placeowner.findOne({ 'account.email': email }, { 'email': 1}, (err, foundEmail) => {
            if (err) {
                console.error(`An error occurred while validating placeowner email [${inputEmail}]:\n${err}`);
                return res.send(false);
            }

            if (foundEmail) {
                console.log(`Found Placeowner Email: ${foundEmail}`);
                res.send(false);
            } else {
                res.send(true);
            }
        })
        break;

    default:
        res.send(false);
    }
})

validateRouter.get('/*', (req, res) => {
    res.sendStatus(404);
})

module.exports = validateRouter;