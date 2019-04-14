const validateRouter = require('express').Router();

// models
const Student = require('../models/student');
const Placeowner = require('../models/placeowner');

validateRouter.get('/email', (req, res) => {

    const inputEmail = req.query.email;
    const role = req.query.role;

    if (!inputEmail || !role) { return res.send(false); }
    
    let query;

    switch (role.toLowerCase())
    {
        case 'student':    query = Student.findOne();    break;
        case 'placeowner': query = Placeowner.findOne(); break;
        default: return res.send(false);
    }

    query.where({ 'account.email': inputEmail }).select('_id')
    .exec((err, found) => {
        if (err) {
            console.error(err);
            return res.send(false);
        }
        
        res.send(!found);
    });
});

module.exports = validateRouter;
