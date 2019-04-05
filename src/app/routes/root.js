const openRouter = require('express').Router();
// const argon2 = require('argon2');

const Place = require('../models/place');

// a middleware to check if a user is logged in
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        if (req.user.account.role === 7) {
            res.redirect('/admin');
        } else {
            next();
        }
    } else {
        res.redirect('/auth');
    }
}

openRouter.get('/', (req, res, next) => {
    res.render('index', { user: req.user, message: req.flash('message') },
    (err, html) => {
        if (err) { return next(err); }
        res.send(html);
    });
});

openRouter.get('/search', (req, res, next) => {

    const query = req.query.schoolName;

    console.log(`Query: ${query}`);

    if (!query) {
        req.flash('message', 'Please provide a school name.');
        return req.session.save((err) => { 
            if (err) { return next(err); }
            res.redirect('/');
        });

    } else if (query.length <= 1) {
        req.flash('message', 'School name is too short.');
        return req.session.save((err) => { 
            if (err) { return next(err); }
            res.redirect('/');
        });
    }

    Place.find((err, places) => {
        if (err) { res.send(null); }
        console.log(places);
        res.send(places);
    });

})

openRouter.get('/profile', isAuthenticated, (req, res, next) => {
    res.render('profile', { user: req.user, message: req.flash('message') },
    (err, html) => {
        if (err) { return next(err); }
        res.send(html);
    });
});

module.exports = openRouter;