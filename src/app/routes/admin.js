const adminRouter = require('express').Router();
const fs = require('fs');
const path = require('path');
const passport = require('../../config/passport');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);
const logger = require('../../config/logger');

// models
const User = require('../models/user');
const Report = require('../models/report');

// directories
const logsDirectory = path.join(__dirname, '../../logs/');

// admin subdomain session and cookie
const cookieOptions = { maxAge: 1000 * 60 * 60 * 1 }; // max cookie age of 1 hour

// set cookie's domain to the main domain at production for it to 
// be accessible by all subdomains e.g. www. and admin.
if (process.env.MODE === 'prod') {
    cookieOptions.domain = 'admin.rsnavigation.com';
    logger.info(`Admin Cookie domain set to: ${cookieOptions.domain}`);
    cookieOptions.secure = true
    logger.info(`Admin Cookie set to HTTPS only.`);
} else {
    cookieOptions.domain = 'admin.localhost.com';
    logger.info(`Admin Cookie domain set to: ${cookieOptions.domain}`);
}

adminRouter.use(session({
    name: 'admin.rsnavi',
    cookie: cookieOptions,
    secret: process.env.ADMIN_SESSION_SECRET,
    saveUninitialized: true, // save the session immediately even if not modified
    resave: true, // resave the session in every request
    store: new MongoStore({ mongooseConnection: mongoose.connection })
}));



// =======================================================================================
// MIDDLEWARES ===========================================================================

// if the user is not authenticated as admin, render admin login page
function isAdmin(req, res, next) {
    if (req.isAuthenticated()) {
        if (req.user.account.role === 7) {
            next();
        } else {
            const err = new Error('Forbidden.');
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
adminRouter.get('/', isAdmin, (req, res, next) => {

    // parallel database querying
    Promise.all([
        User.find({ $or: [{ 'account.role': 0 }, { 'account.role': 1 }] }).exec(),
        Report.find().populate('author target')
    ])
    .then(([users, reports]) => {
        let students = users.filter(user => user.account.role === 0);
        let placeowners = users.filter(user => user.account.role === 1);

        res.render('admin/home', 
        { 'admin': req.user, 'students': students, 'placeowners': placeowners, 
          'reports': reports, 'message': req.flash('message') },
        (err, html) => (err) ? next(err) : res.send(html));
    })
    .catch(next);
});

// GET admin.rsnavigation.com/logs
adminRouter.get('/logs', isAdmin, (req, res, next) => {
    if (fs.existsSync(logsDirectory + 'access.log')) {
        res.sendFile('access.log', { root: logsDirectory});
        logger.info(`${req.user.fullName} accessed logs.`);
    } else {
        return next();
    }
})

// GET admin.rsnavigation.com/logout
adminRouter.get('/logout', (req, res, next) => {

    // redirect to admin login page if not authenticated
    if (!req.isAuthenticated()) { return res.redirect('/'); }

    // logout the admin if authenticated user's account role is equal to 7
    if (req.user.account.role === 7) {
        req.logout();
        req.flash('message', 'Logged out.');
        req.session.save(err => err ? next(err) : res.redirect('/'));

    // redirect to profile page if the account is a regular user
    } else {
        const err = new Error('Forbidden.');
        err.status = 403; next(err);
    }
});

// ==========================================================================================================================================
// POST =====================================================================================================================================

// POST admin.rsnavigation.com/login
adminRouter.post('/login', (req, res, next) => {
    
    logger.info('Admin Login Page');

    // use configured local login strategy for admin
    passport.authenticate('local-login-admin', (err, admin) => {

        // if an errror occurred, send status 500
        if (err) { return next(err); }

        // if no admin account with the provided credentials is found, redirect to admin login page
        if (!admin) {
            return req.session.save(err => err ? next(err) : res.redirect('/'));
        }

        // authenticate the admin and bind it to request as req.user
        req.login(admin, err => {
            if (err) { return next(err); } // status 500
            req.session.save(err => err ? next(err) : res.redirect('/'));
        });

    }) (req, res, next);
});

module.exports = adminRouter;
