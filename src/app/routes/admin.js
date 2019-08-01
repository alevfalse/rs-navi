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
const formatDate = require('../../bin/date-formatter');
const mailer = require('../../config/mailer');

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
    res.render('admin/home', { 'admin': req.user, 'message': req.flash('message') },
    (err, html) => err ? next(err) : res.send(html));
});

adminRouter.get('/access', isAdmin, (req, res, next) => {
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

adminRouter.get('/audit', isAdmin, (req, res, next) => {
    console.log('Requesting audit logs...');
    Audit.find((err, auditLogs) => {
        if (err || auditLogs.length === 0) { return res.send(null); }

        let arr = [];

        for (let i=auditLogs.length-1; i>=0; i--) {
            arr.push({
                date: formatDate(auditLogs[i].createdAt, true),
                text: auditLogs[i].toString(),
                ip: auditLogs[i].ip || 'Unknown'
            });
        }

        res.send(arr);
    });
});

adminRouter.get('/reports', isAdmin, (req, res, next) => {

    Report.aggregate([
        { $match: { status: 0 } },
        {
            $group: {
                _id: { target: "$target" },
                docs: { $push: "$$ROOT" }
            }
        }
    ]).exec((err, reports) => {
        if (err) { logger.error(err.stack); return res.send(null); }
        if (reports.length === 0) { return res.send(null); }

        Place.populate(reports, {
            path: '_id.target',
            match: { status: 1 },
            select: 'name'
        }, (err, reports) => {
            if (err) { logger.error(err.stack); return res.send(null); }

            User.populate(reports, {
                path: 'docs.author',
                match: { 'account.status': 1 },
                select: 'firstName lastName'
            }, (err, results) => {
                if (err) { logger.error(err.stack); return res.send(null); }

                console.log(results[0].docs[0]);

                const places = [];

                for (let result of results) {

                    const reports = [];

                    for (doc of result.docs) {

                        let typeString;

                        switch(doc.type)
                        {
                            case 0: typeString = 'Not available'; break;
                            case 1: typeString = 'Placeowner not responding'; break;
                            case 2: typeString = 'Incorrect information'; break;
                            case 3: typeString = 'Duplicate listing'; break;
                            case 4: typeString = 'Fake or spam'; break;
                            case 5: typeString = 'Other'; break;
                            default: typeString = 'Unknown';
                        }
                        
                        reports.push({
                            author: {
                                id: doc.author._id,
                                name: `${doc.author.firstName} ${doc.author.lastName}`
                            },
                            type: typeString,
                            comment: doc.comment
                        });
                    }

                    places.push({
                        id: result._id.target._id,
                        name: result._id.target.name,
                        reports: reports
                    });
                }

                console.log(places[0].reports[0]);
                res.send(places);
            });
        });
    });
});

adminRouter.get('/prc', isAdmin, (req, res, next) => {
    console.log('Requesting pending license...');
    User.find({ 'license.status': 1, 'account.role': 1, 'account.status': 1 },
    (err, placeowners) => {
        if (err) { return next(err); }
        
        const arr = [];

        for (owner of placeowners) {
            arr.push({
                id: owner._id,
                name: owner.fullName,
                license: owner.licenseTypeString
            });
        }

        res.send(arr);
    });
});

adminRouter.get('/deleted/users', isAdmin, (req, res, next) => {
    console.log('Requesting deleted users...');
    User.find({ '$or': [{ 'account.status': 3 }, { 'account.status': 4 }] },
    (err, users) => {
        if (err) { return next(err); }
        console.log(users.length);
        res.json(users);
    });
});

adminRouter.get('/deleted/places', isAdmin, (req, res, next) => {
    console.log('Requesting deleted users...');
    Place.find({ 'status': 0 }, (err, places) => {
        if (err) { return next(err); }
        console.log(places.length);
        res.json(places);
    });
});

adminRouter.get('/deleted/places', isAdmin, (req, res, next) => {
    console.log('Requesting pending license...');
    User.find({ 'license.status': 1, 'account.role': 1, 'account.status': 1 },
    (err, placeowners) => {
        if (err) { return next(err); }
        
        const arr = [];

        for (owner of placeowners) {
            arr.push({
                id: owner._id,
                name: owner.fullName,
                license: owner.licenseTypeString
            });
        }

        res.send(arr);
    });
});

// GET admin.rsnavigation.com/logout
adminRouter.get('/logout', (req, res, next) => {

    // redirect to admin login page if not authenticated
    if (!req.isAuthenticated()) { return res.redirect('/'); }

    // logout the admin if authenticated user's account role is equal to 7
    if (req.user.account.role === 7) {
        audit.userLogout(req.user._id, req.ip);
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

// TODO: Add restore banned placeowners and their places

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
            audit.userLogin(admin._id, req.ip);
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

                // audit license verification
                audit.validateLicense(req.user._id, req.ip, placeowner._id, true);
                // send an email to the placeowner
                mailer.sendVerifiedLicenseEmail(placeowner, (err) => { if (err) logger.error(err.stack); });

            } else if (valid === 'false') {
                action = 'Rejected';

                // audit license rejection
                audit.validateLicense(req.user._id, req.ip, false);
                // send an email to the placeowner
                mailer.sendRejectedLicenseEmail(placeowner, (err) => { if (err) logger.error(err.stack); });

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

            Place.updateMany({ 'owner': user._id }, { 'status': 0 },
            (err, result) => {
                if (err) { return next(err); }

                console.log(result);
                
                req.flash('message', `Banned ${user.fullName} and deleted their listed places.`);
                req.session.save(err => err ? next(err) : res.redirect('/'));
                audit.ban(req.user._id, req.ip, user._id, reason);
            });
        });
    });
});

adminRouter.post('/restore/user/:id', isAdmin, (req, res, next) => {
    const id = sanitize(req.params.id);
    const reason = sanitize(req.body.reason);

    console.log(`Reason: ${reason}`);

    User.findOneAndUpdate({ '_id': id },  { 'account.status': 1 },
    (err, user) => {
        if (err || !user) { return next(err); }

        user.account.status = 4;
        user.save(err => {
            if (err) { return next(err); }

            Place.updateMany({ 'owner': user._id }, { 'status': 1 },
            (err, result) => {
                if (err) { return next(err); }

                console.log(result);
                
                req.flash('message', `Banned ${user.fullName} and deleted their listed places.`);
                req.session.save(err => err ? next(err) : res.redirect('/'));
                audit.ban(req.user._id, req.ip, user._id, reason);
            });
        });
    });
});

module.exports = adminRouter;
