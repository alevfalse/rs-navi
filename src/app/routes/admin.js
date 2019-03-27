const adminRouter = require('express').Router();
const passport = require('../../config/passport');

const Student = require('../models/student');
const Placeowner = require('../models/placeowner');


function isAuthenticated(req, res, next) {
    if (req.isAuthenticated() && req.user.account.role == 7) {
        return next();
    }
        
    console.log(`Unauthorized access for Admin URL: ${req.url}`);
    req.flash('message', 'Unauthorized!');
    return req.session.save((err) => {
        if (err) { console.error(err); }
        res.redirect('/admin/login');
    });
}

// GET rsnavigation.com/admin
adminRouter.get('/', isAuthenticated, (req, res) => {
    
    Student.find((err, students) => {
        if (err) {
            console.error(err);
            return res.sendStatus(500); // TODO: Send custom status 500 page
        }

        Placeowner.find((err, placeowners) => {
            if (err) {
                console.error(err);
                return res.sendStatus(500); // TODO: Send custom status 500 page
            }
        
            res.render('admin/home', { admin: req.user, students: students, placeowners: placeowners, message: req.flash('message') },
            (err, html) => {
                if (err) {
                    console.error(err);
                    return res.sendStatus(500); // TODO: Send custom status 500 page
                }
                return res.send(html);
            });
        });
    });
});

// GET rsnavigation.com/admin/login
adminRouter.get('/login', (req, res) => {

    req.session.save((err) => {
        if (err) {
            console.error(err);
            return res.sendStatus(500); // TODO: Send custom status 500 page
        }

        res.render('admin/login', { message: req.flash('message') },
        (err, html) => {
            if (err) {
                console.error(err);
                return res.sendStatus(500); // TODO: Send custom status 500 page
            }
            return res.send(html);
        });
    });
});

// GET rsnavigation.com/admin/login
adminRouter.get('/logout', (req, res) => {

    if (req.isAuthenticated()) {

        if (req.user.account.role == 7) {
            req.logOut();
            req.flash('message', 'Logged out admin account.');
            req.session.save((err) => {
                if (err) { console.error(err); }
                res.redirect('/admin/login');
            })

        } else {
            req.flash('message', 'You are not logged in as admin.');
            req.session.save((err) => {
                if (err) { console.error(err); }
                res.redirect('/admin/login');
            });
        }

    } else {
        req.flash('message', 'Unauthorized!');
        req.session.save((err) => {
            if (err) { console.error(err); }
            res.redirect('/admin/login');
        });
    }
});

// Invalid URL
adminRouter.get('/*', (req, res) => {
    req.flash('message', 'Page not found.');
    return req.session.save((err) => {
        if (err) { console.error(err); }
        res.redirect('/admin');
    });
});

// rsnavigation.com/admin/login
adminRouter.post('/login', (req, res, next) => {
    
    passport.authenticate('local-login-admin', (err, admin) => {

        // if an error occurred or no user is found with the provided login credentials
        if (err || !admin) {
            return res.redirect('/login');
        }

        req.logIn(admin, (err) => {
            if (err) { 
                console.error(err);
                req.flash('message', 'Failed to log in. Please try logging in again later.');
                return req.session.save((err) => {
                    if (err) { console.error(err); }
                    res.redirect('/admin/login');
                });
            }
                
            req.session.save((err) => {
                if (err) { console.error(err); }
                res.redirect('/admin');
            });
        });
    }) (req, res, next);
});

module.exports = adminRouter;
