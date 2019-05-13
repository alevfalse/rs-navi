const authRouter = require('express').Router();
const passport = require('../../config/passport');
const logger = require('../../config/logger');
const mailer = require('../../config/mailer');
const generate = require('../../bin/generator');
const sanitize = require('../../bin/sanitizer');
const isEmail = require('validator/lib/isEmail');
const validators = require('../../bin/validators');
const audit = require('../../bin/auditor');

// models
const User = require('../models/user');

// MIDDLEWARES ===========================================================================

function stillLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        req.flash('message', 'You are still logged in.');
        return req.session.save(err => err ? next(err) : res.redirect('/profile'));
    } else {
        next();
    }
}

// rate limiters
const RateLimitMongoStore = require('rate-limit-mongo');
const RateLimit = require('express-rate-limit');
const dbURI = require('../../config/database');

const forgotPasswordRateLimiter = RateLimit({
    store: new RateLimitMongoStore({ 
        uri: dbURI,
        collectionName: 'forgotPasswordHits',
        expireTimeMs: 60 * 60 * 1000 // 1 hour
    }),
    max: 3, // limit each IP to 3 forgot password requests per expireTimeMs
    handler: function(req, res, next) {
        req.flash('message', 'Too many forgot password requests.<br>Please try again later.');
        req.session.save(err => err ? next(err) : res.redirect('/auth'));
    }
});

const signupRateLimiter = RateLimit({
    store: new RateLimitMongoStore({ 
        uri: dbURI,
        collectionName: 'signupHits',
        expireTimeMs: 60 * 60 * 1000 // 1 hour
    }),
    max: 2, // limit each IP to 2 signups per expireTimeMs
    handler: function(req, res, next) {
        req.flash('message', 'Too many accounts created.<br>Please try again later.');
        req.session.save(err => err ? next(err) : res.redirect('/auth'));
    }
});

// prevent admin users from accessting this route
authRouter.use((req, res, next) => {
    req.get('host').split('.')[0] === 'admin' ? res.redirect('/') : next();
});

// =======================================================================================
// GET ROUTES ============================================================================

// GET rsnavigation.com/auth/
authRouter.get('/', (req, res, next) => {

    if (req.isAuthenticated()) {
        req.flash('message', 'You are already logged in.');
        return req.session.save(err => err ? next(err) : res.redirect('/profile'));
    }

    const options = {
        user: req.user,
        message: req.flash('message'),
        placeowner: parseInt(req.query.placeowner) === 1 ? 1 : null // if 'Add A Place' was clicked while not logged in
    }

    res.render('auth', options, (err, html) => err ? next(err) : res.send(html));
});

// validates email availability during sign up
// GET rsnavigation.com/auth/validate/email?q=email
authRouter.get('/validate/email', (req, res, next) => {
    let email = req.query.q;

    if (typeof email === 'undefined' || !isEmail(email)) { return res.send('2'); }
    
    User.findOne({ 'account.email': sanitize(email) }, '_id', (err, user) => {
        if (err) { logger.error(err.stack); }
        user ? res.send('0') : res.send('1');
    });
});

// GET rsnavigation.com/auth/logout
authRouter.get('/logout', (req, res) => {
    if (req.isAuthenticated()) {
        audit.userLogout(req.user._id, req.ip);
        req.logout();
        req.flash('message', 'Logged out.');
    }

    req.session.save(err => err ? next(err) : res.redirect('/auth'));
})

// GET rsnavigation.com/verify/<hashCode>
authRouter.get('/verify/:hashCode', stillLoggedIn, (req, res, next) => {

    if (!validators.hashCode(req.params.hashCode)) { return next(); }
    
    const code = sanitize(req.params.hashCode);

    User.findOne({ 'account.hashCode': code, 'account.status': 0 }, (err, user) => {
        if (err || !user) { return next(err); }

        user.verifyEmail(err => {
            if (err) { return next(err); }

            req.login(user, err => {
                if (err) { return next(err); } 
                req.flash('message', 'Verified email address.');
                req.session.save(err => err ? next(err) : res.redirect('/profile'));
                audit.verifyEmail(user._id, req.ip);
            });
        });
    });
});

// GET rsnavigation.com/reset/<role>/<hashCode>
authRouter.get('/reset/:hashCode', stillLoggedIn, (req, res, next) => {

    if (!validators.hashCode(req.params.hashCode)) { return next(); }
    const code = sanitize(req.params.hashCode);
    User.findOne({ 'account.hashCode': code, 'account.status': 1 }, (err, user) => {
        if (err || !user) { return next(err); } 

        res.render('reset', { 'message': req.flash('message'), 'user': user }, 
        (err, html) => err ? next(err) : res.send(html));
    });
});



// ========================================================================================
// POST ROUTES ============================================================================

// POST rsnavigation.com/auth/login
authRouter.post('/login', stillLoggedIn, (req, res, next) => {

    passport.authenticate('local-login', (err, user) => {
        if (err) { return next(err); }
        if (!user) { return req.session.save(err => err ? next(err) : res.redirect('/auth')); }

        req.login(user, (err) => {
            if (err) { return next(err); } 
            req.session.save(err => err ? next(err) : res.redirect('/profile'));
            audit.userLogin(user._id, req.ip);
        });
    }) (req, res, next);
});

// POST rsnavigation.com/auth/signup
authRouter.post('/signup', stillLoggedIn, signupRateLimiter, (req, res, next) => {

    passport.authenticate('local-signup', (err, user) => {
        if (err) { return next(err); }
        req.session.save(err => err ? next(err) : res.redirect('/auth'));
        if (user) { audit.signup(user._id, req.ip); }
    }) (req, res, next);
});

// POST rsnavigation.com/auth/forgot
authRouter.post('/forgot', stillLoggedIn, forgotPasswordRateLimiter, (req, res, next) => {

    const formError = validators.forgotPassword(req.body.email, req.body.role);
    if (formError) {
        req.flash('message', formError);
        return req.session.save(err => err ? next(err) : res.redirect('/auth'));
    }

    const email = sanitize(req.body.email);
    const role = sanitize(req.body.role);

    User.findOne({ 'account.email': sanitize(email), 'account.role': role === 'student' ? 0 : 1 }, 
    (err, user) => {

        if (err) { return next(err); } 

        // if no student account with such email was found
        if (!user) { 
            req.flash('message', 'Email does not exist.');
            return req.session.save(err => err ? next(err) :res.redirect('/auth'));
        }

        // if the student account is still unverified
        if (user.account.status === 0) {
            req.flash('message', 'Your email address is still unverified. Check your email for the verification link.');
            return req.session.save(err => err ? next(err) :res.redirect('/auth'));
        }

        user.account.hashCode = generate();
        user.save(err => {
            if (err) { return next(err) }

            mailer.sendResetPasswordEmail(user, err => {
                if (err) { return next(err) }

                req.flash('message', 'Password reset link has been sent to your email.');
                req.session.save(err => err ? next(err) : res.redirect('/auth'));
                audit.forgotPassword(user._id, req.ip);
            });
        });
    });
});

// POST rsnavigation.com/auth/reset
authRouter.post('/reset', stillLoggedIn, (req, res, next) => {
    
    const formError = validators.resetPassword(req.body.hashCode, req.body.newPassword, req.body.confirmNewPassword);
    if (formError) {
        req.flash('message', formError);
        return req.session.save(err => err ? next(err) : res.redirect(`/auth/reset/${hashCode}`)) 
    }

    const hashCode = sanitize(req.body.hashCode);
    const newPassword = sanitize(req.body.newPassword);
    
    User.findOne({ 'account.hashCode': hashCode, 'account.status': 1 },
    async (err, user) => {
        if (err || !user) { return next(err); }

        user.updatePassword(newPassword, err => {
            if (err) { return next(err); }

            req.flash('message', 'Password updated.');
            req.session.save(err => err ? next(err) : res.redirect('/auth'));
            audit.resetPassword(user._id, req.ip);
        }, true);
    });
});

module.exports = authRouter;
