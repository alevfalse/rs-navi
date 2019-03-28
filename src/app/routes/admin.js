const adminRouter = require('express').Router();
const passport = require('../../config/passport');

const Student = require('../models/student');
const Placeowner = require('../models/placeowner');

// middleware functions
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated() && req.user.account.role == 7) {
        return next();
    }
        
    console.log(`Unauthorized access for Admin URL: ${req.url}`);
    req.flash('message', 'Unauthorized!');
    return req.session.save((err) => {
        if (err) { return next(err); }
        res.redirect('/admin/login');
    });
}

// =======================================================================================================================================
// GET ===================================================================================================================================

// GET rsnavigation.com/admin
adminRouter.get('/', isAuthenticated, (req, res) => {
    
    Student.find((err, students) => {
        if (err) { return next(err); }

        Placeowner.find((err, placeowners) => {
            if (err) { return next(err); }
        
            res.render('admin/home', { admin: req.user, students: students, placeowners: placeowners, message: req.flash('message') },
            (err, html) => {
                if (err) { return next(err); }
                return res.send(html);
            });
        });
    });
});

// GET rsnavigation.com/admin/login
adminRouter.get('/login', (req, res) => {

    req.session.save((err) => {
        if (err) { return next(err); }

        res.render('admin/login', { message: req.flash('message') },
        (err, html) => {
            if (err) { return next(err); }
            res.send(html);
        });
    });
});

// GET rsnavigation.com/admin/login
adminRouter.get('/logout', (req, res) => {

    if (req.isAuthenticated()) {

        if (req.user.account.role == 7) {
            req.logout();
            req.flash('message', 'Logged out admin account.');
            req.session.save((err) => {
                if (err) { return next(err); }
                res.redirect('/admin/login');
            })

        } else {
            req.flash('message', 'You are not logged in as admin.');
            req.session.save((err) => {
                if (err) { return next(err); }
                res.redirect('/admin/login');
            });
        }

    } else {
        req.flash('message', 'Unauthorized!');
        req.session.save((err) => {
            if (err) { return next(err); }
            res.redirect('/admin/login');
        });
    }
});

// ==========================================================================================================================================
// POST =====================================================================================================================================

// POST rsnavigation.com/admin/login
adminRouter.post('/login', (req, res, next) => {
    
    passport.authenticate('local-login-admin', (err, admin) => {

        if (err) { return next(err); }

        // if an error occurred or no user is found with the provided login credentials
        if (!admin) {
            req.session.save((err) => {
                if (err) { return next(err); }
                res.redirect('/admin/login');
            });
            return;
        }

        req.logIn(admin, (err) => {
            if (err) { 
                if (err) { return next(err); }
                req.flash('message', 'Failed to log in. Please try logging in again later.');
                req.session.save((err) => {
                    if (err) { return next(err); }
                    res.redirect('/admin/login');
                });
                return;
            }
                
            req.session.save((err) => {
                if (err) { return next(err); }
                res.redirect('/admin');
            });
        });

    }) (req, res, next);
});

module.exports = adminRouter;
