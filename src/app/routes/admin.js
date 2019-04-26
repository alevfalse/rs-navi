const adminRouter = require('express').Router();
const passport = require('../../config/passport');

const Student = require('../models/student');
const Placeowner = require('../models/placeowner');

// if the user is not authenticated as admin, render admin login page
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated() && req.user.account.role == 7) {
        return next();
    }

    res.render('admin/login', { message: req.flash('message') },
    (err, html) => {
        if (err) { return next(err); }
        res.send(html);
    });
}

// ==========================================================================================================================================
// GET ======================================================================================================================================

// GET rsnavigation.com/admin
adminRouter.get('/', isAuthenticated, (req, res, next) => {

    // parallel database querying
    Promise.all([
        Student.find().populate('account image').exec(),
        Placeowner.populate('account image').find().exec()
    ])
    .then(([students, placeowners]) => {
        res.render('admin/home', 
        { admin: req.user, students: students, placeowners: placeowners, message: req.flash('message') },
        (err, html) => {
            if (err) { return next(err); }
            res.send(html);
        });
    })
    .catch((err) => { return next(err); })
});

// GET rsnavigation.com/admin/logout
adminRouter.get('/logout', (req, res, next) => {

    // redirect to admin login page if not authenticated
    if (!req.isAuthenticated()) {
        return res.redirect('/admin');
    }

    // logout the admin if authenticated user's account role is equal to 7
    if (req.user.account.role === 7) {
        req.logout();
        req.flash('message', 'Logged out admin account.');
        req.session.save((err) => {
            if (err) { return next(err); }
            res.redirect('/admin');
        });

    // redirect to profile page if the account is a regular user
    } else {
        req.flash('message', 'You are not logged in as admin.');
        req.session.save((err) => {
            if (err) { return next(err); }
            res.redirect('/profile');
        });
    }
});



// ==========================================================================================================================================
// POST =====================================================================================================================================

// POST rsnavigation.com/admin/login
adminRouter.post('/login', (req, res, next) => {
    
    // use configured local login strategy for admin
    passport.authenticate('local-login-admin', (err, admin) => {

        // if an error occurred, pass error to error handler configured in server.js
        if (err) { return next(err); }

        // if no admin with provided credentials is found, redirect to admin login page
        if (!admin) {
            return req.session.save((err) => {
                if (err) { return next(err); }
                res.redirect('/admin');
            });
        }

        // authenticate the admin and bind it to request as req.user
        req.logIn(admin, (err) => {
            if (err) { return next(err); } // status 500
                
            req.session.save((err) => {
                if (err) { return next(err); }
                res.redirect('/admin');
            });
        });

    }) (req, res, next);
});

module.exports = adminRouter;
