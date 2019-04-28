const adminRouter = require('express').Router();
const passport = require('../../config/passport');

const Student = require('../models/student');
const Placeowner = require('../models/placeowner');
const Report = require('../models/report');

// if the user is not authenticated as admin, render admin login page
function isAuthenticated(req, res, next) {

    if (req.isAuthenticated()) {
        if (req.user.account.role === 7) {
            next();
        } else {
            const err = new Error('Logged in as student.');
            err.status = 403;
            next(err);
        }
    } else {
        res.render('admin/login', { message: req.flash('message') },
        (err, html) => {
            if (err) { return next(err); }
            res.send(html);
        });
    }
}



// ==========================================================================================================================================
// GET ======================================================================================================================================

// GET admin.rsnavigation.com/
adminRouter.get('/', isAuthenticated, (req, res, next) => {

    // parallel database querying
    Promise.all([
        Student.find().populate('account image').exec(),
        Placeowner.find().populate('account image').exec(),
        Report.find()
            .populate('place')
            .populate({
                path: 'author',
                model: 'Student'
            })
            .populate({
                path: 'author',
                model: 'Placeowner'
            })
    ])
    .then(([students, placeowners, reports]) => {
        console.log(reports);
        res.render('admin/home', 
        { 'admin': req.user, 'students': students, 'placeowners': placeowners, 
          'reports': reports, 'message': req.flash('message') },
        (err, html) => (err) ? next(err) : res.send(html));
    })
    .catch((err) => { return next(err); })
});

// GET admin.rsnavigation.com/logout
adminRouter.get('/logout', (req, res, next) => {

    // redirect to admin login page if not authenticated
    if (!req.isAuthenticated()) {
        return res.redirect('/');
    }

    // logout the admin if authenticated user's account role is equal to 7
    if (req.user.account.role === 7) {
        req.logout();
        req.flash('message', 'Logged out.');
        req.session.save((err) => {
            if (err) { return next(err); }
            res.redirect('/');
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

// POST admin.rsnavigation.com/login
adminRouter.post('/login', (req, res, next) => {
    
    // use configured local login strategy for admin
    passport.authenticate('local-login-admin', (err, adminAccount) => {

        // if an errror occurred, send status 500
        if (err) { return next(err); }

        // if no admin account with the provided credentials is found, redirect to admin login page
        if (!adminAccount) {
            return req.session.save(err => err ? next(err) : res.redirect('/'));
        }

        console.log('\n--- Admin Account ---');
        console.log(adminAccount);
        console.log('--- ---\n');

        // authenticate the admin and bind it to request as req.user
        req.login(adminAccount, err => {
            if (err) { return next(err); } // status 500
            console.log(`Logged in Admin`);
            req.session.save(err => err ? next(err) : res.redirect('/'));
        });

    }) (req, res, next);
});

module.exports = adminRouter;
