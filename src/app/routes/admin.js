const adminRouter = require('express').Router();
const fs = require('fs');
const path = require('path');
const passport = require('../../config/passport');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);
const logger = require('../../config/logger');
const sanitize = require('../../bin/sanitizer');
const audit = require('../../bin/auditor');
const rateLimiter = require('../../config/rate-limiter');

// models
const User = require('../models/user');
const Place = require('../models/place');
const Report = require('../models/report');
const Audit = require('../models/audit');

// directories
const logsDirectory = path.join(__dirname, '../../logs/');

// admin subdomain session and cookie
const cookieOptions = { maxAge: 1000 * 60 * 30 }; // max cookie age of 30 minutes

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
        // query all placeowners whose license status are unverified
        User.find({ 'account.role': 1, 'license.status': 1 }).exec(),
        Report.aggregate([
            { $match: { status: 0 } },
            {
                $group: {
                    _id: { target: "$target" },
                    docs: { $push: "$$ROOT" }
                }
            }
        ]).exec()
    ])
    .then(([placeowners, reports, audit]) => {
        Place.populate(reports, {
            path: '_id.target',
            match: { status: 1 },
            select: 'name'
        }, (err, reports) => {
            if (err) { return next(err); }

            User.populate(reports, {
                path: 'docs.author',
                match: { 'account.status': 1 }
            }, (err, reports) => {
                if (err) { return next(err); }

                res.render('admin/home', { 'admin': req.user, 'reports': reports, 
                'placeowners': placeowners, 'audit': audit, 'message': req.flash('message') },
                (err, html) => err ? next(err) : res.send(html));
            });
        });
    })
    .catch(next);
});

adminRouter.get('/access', rateLimiter, isAdmin, (req, res, next) => {
    console.log('Requesting access logs...');
    let logs = '';
    if (fs.existsSync(logsDirectory + 'access.log')) {
        const lines = fs.readFileSync(logsDirectory + 'access.log').toString().split('\n');
        for (let i=lines.length-1; i >= 0; i--) {
            logs += lines[i] + '<br>';
        }
    }
    res.send(logs);
});

adminRouter.get('/audit', rateLimiter, isAdmin, (req, res, next) => {
    console.log('Requesting audit logs...');
    Audit.find((err, logs) => {
        if (err || logs.length === 0) { return res.send(null); }
        let str = '';
        for (let i=logs.length-1; i>=0; i--) {
            str += logs[i].toString() + '<br>';
        }
        res.send(str);
    });
});

// GET admin.rsnavigation.com/logout
adminRouter.get('/logout', (req, res, next) => {

    // redirect to admin login page if not authenticated
    if (!req.isAuthenticated()) { return res.redirect('/'); }

    // logout the admin if authenticated user's account role is equal to 7
    if (req.user.account.role === 7) {
        audit.logout(req.user._id);
        req.logout();
        req.flash('message', 'Logged out.');
        req.session.save(err => err ? next(err) : res.redirect('/'));

    // status 403
    } else {
        const err = new Error('Forbidden.');
        err.status = 403; next(err);
    }
});

adminRouter.get('/auth', (req, res, next) => {
    res.redirect('/');
});



// ==========================================================================================================================================
// POST ROUTES ==============================================================================================================================

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
            audit.login(admin._id);
        });

    }) (req, res, next);
});

adminRouter.post('/prc/:id', isAdmin, (req, res, next) => {
    const id = sanitize(req.params.id);
    const valid = sanitize(req.query.valid);
    
    if (typeof id === 'undefined') { return next(); }

    User.findOne({ '_id': id,  'account.role': 1, 'account.status': 1 }, (err, placeowner) => {
        if (err || !placeowner) { return next(err); }

        console.log(placeowner);

        if (valid === 'true') { placeowner.license.status = 2; }
        else { placeowner.license.status = 3; }

        placeowner.save(err => {
            if (err) { return next(err); }

            let action;

            if (valid === 'true') {
                action = 'Verified';
                audit.validateLicense(req.user._id, 72, 2);
            } else if (valid === 'false') {
                action = 'Rejected';
                audit.validateLicense(req.user._id, 73, 2);
            } else {
                return next();
            }

            req.flash('message', `${action} ${placeowner.fullName}'s license.`);
            req.session.save(err => err ? next(err) : res.redirect('/'));
        });
    });
});

adminRouter.post('/ban/:id', isAdmin, (req, res, next) => {
    const id = sanitize(req.params.id);
    const reason = sanitize(req.body.reason);

    console.log(`Reason: ${reason}`);

    User.findOne({ '_id': id, 'account.status': 1 }, 
    (err, user) => {
        if (err || !user) { return next(err); }

        user.account.status = 4;
        user.save(err => {
            if (err) { return next(err); }
            req.flash('message', `Banned ${user.fullName}.`);
            req.session.save(err => err ? next(err) : res.redirect('/'));
            audit.ban(req.user._id, user._id, reason);
        });
    });
});

module.exports = adminRouter;
