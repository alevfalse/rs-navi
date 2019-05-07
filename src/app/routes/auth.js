const authRouter = require('express').Router();
const passport = require('../../config/passport');
const logger = require('../../config/logger');
const mailer = require('../../config/mailer');
const generate = require('../../bin/generator');
const sanitize = require('../../bin/sanitizer');
const isEmail = require('validator/lib/isEmail');
const validators = require('../../bin/validators');

// models
const User = require('../models/user');

// MIDDLEWARES ===========================================================================

// checks if client is already authenticated
function isAuthenticated(req, res, next) {

    // redirect to profile/admin page if already logged in
    if (req.isAuthenticated()) {
        if (req.user.account.role === 7) {
            res.redirect('/');
        } else {
            res.redirect('/profile')
        }
    } else {
        next();
    }
}

// prevent admin users from accessting this route
authRouter.use((req, res, next) => {
    req.get('host').split('.')[0] === 'admin' ? res.redirect('/') : next();
});

// =======================================================================================
// GET ROUTES ============================================================================

// GET rsnavigation.com/auth/
authRouter.get('/', isAuthenticated, (req, res, next) => {
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

    if (!email || !isEmail(email)) { return res.send('2'); }
    
    User.findOne({ 'account.email': sanitize(email) }, '_id', (err, user) => {
        if (err) { logger.error(err.stack); }
        user ? res.send('0') : res.send('1');
    });
});

// GET rsnavigation.com/auth/logout
authRouter.get('/logout', (req, res) => {
    if (req.isAuthenticated()) {
        req.logout();
        req.flash('message', 'Logged out.');
    }

    req.session.save(err => err ? next(err) : res.redirect('/auth'));
})

// GET rsnavigation.com/verify/<hashCode>
authRouter.get('/verify/:hashCode', (req, res, next) => {

    if (req.isAuthenticated()) {
        req.flash('message', 'You are still logged in.');
        return req.session.save(err => err ? next(err) : res.redirect('/profile'));
    }

    const hashCode = sanitize(req.params.hashCode);

    if (!validators.validateHashCode(hashCode)) { return next(); }

    User.findOne({ 'account.hashCode': hashCode, 'account.status': 0 }, (err, user) => {
        if (err || !user) { return next(err); }

        user.verifyEmail(err => {
            if (err) { return next(err); }

            req.login(user, err => {
                if (err) { return next(err); } 
                req.flash('message', 'Verified email address.');
                req.session.save(err => err ? next(err) : res.redirect('/profile'));
            });
        });
    });
});

// GET rsnavigation.com/reset/<role>/<hashCode>
authRouter.get('/reset/:hashCode', (req, res, next) => {

    if (req.isAuthenticated()) {
        req.flash('message', 'You are still logged in.');
        return req.session.save(err => err ? next(err) : res.redirect('/profile'));
    }

    if (!validators.validateHashCode(req.params.hashCode)) { return next(); }

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
authRouter.post('/login', (req, res, next) => {
    passport.authenticate('local-login', (err, user) => {
        if (err) { return next(err); }
        if (!user) { return req.session.save(err => err ? next(err) : res.redirect('/auth')); }

        req.login(user, (err) => {
            if (err) { return next(err); } 
            req.session.save(err => err ? next(err) : res.redirect('/profile'));
        });
    }) (req, res, next);
});

// POST rsnavigation.com/auth/signup
authRouter.post('/signup', (req, res, next) => {
    passport.authenticate('local-signup', (err, user) => {
        if (err) { return next(err); }
        req.session.save(err => err ? next(err) : res.redirect('/auth'));
    }) (req, res, next);
});

// POST rsnavigation.com/auth/forgot
authRouter.post('/forgot', (req, res, next) => {

    const email = req.body.email;
    const role = req.body.role;

    const formError = validators.validateForgotPasswordForm(email, role);
    if (formError) {
        req.flash('message', formError);
        return req.session.save(err => err ? next(err) : res.redirect('/auth'));
    }

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
            });
        });
    });
});

// POST rsnavigation.com/auth/reset
authRouter.post('/reset', (req, res, next) => {

    if (req.isAuthenticated()) {
        req.flash('message', 'You are still logged in.');
        return req.session.save(err => err ? next(err) : res.redirect('/profile'));
    }

    const hashCode = req.body.hashCode;
    const newPassword = req.body.newPassword;
    const confirmNewPassword = req.body.confirmNewPassword;
    
    const formError = validators.validateResetPasswordForm(hashCode, newPassword, confirmNewPassword);
    if (formError) {
        req.flash('message', formError);
        return req.session.save(err => err ? next(err) : res.redirect(`/auth/reset/${hashCode}`)) 
    }
    
    User.findOne({ 'account.hashCode': hashCode, 'account.status': 1 },
    async (err, user) => {
        if (err || !user) { return next(err); }

        user.updatePassword(newPassword, err => {
            if (err) { return next(err); }

            req.flash('message', 'Password updated.');
            req.session.save(err => err ? next(err) : res.redirect('/auth'));
        }, true);
    });
});

module.exports = authRouter;
