const authRouter = require('express').Router();
const passport = require('../../config/passport');
const generate = require('../../bin/generator');
const logger = require('../../config/logger');

// model
const User = require('../models/user');

// FUNCTIONS ============================================================================
const sanitizer = require('../../bin/sanitizer');
const mailer = require('../../config/mailer');
const validateForgotPasswordForm = require('../../bin/forgot-validation');

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
})

// GET rsnavigation.com/auth/logout
authRouter.get('/logout', (req, res) => {
    if (req.isAuthenticated()) {
        new Audit({ executor: req.user._id, action: 5 })
            .save(err => { if (err) logger.error(err); });
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

    const hashCode = req.params.hashCode;

    if (!hashCode) { return next(); } // status 404

    User.findOne({ 'account.hashCode': hashCode, 'account.status': 0 },
    (err, user) => {
        logger.info(user);
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
    const hashCode = req.params.hashCode;

    if (!hashCode) { return next(); } // status 404 

    User.findOne({ 'hashCode': hashCode, '_id': id, 'status': 1 },
    (err, account) => {
        if (err || !account) { return next(err); } 

        res.render('reset', { 'message': req.flash('message'), 'account': account }, 
        (err, html) => err ? next(err) : res.send(html));
    });
});



// ========================================================================================
// POST ROUTES ============================================================================

// POST rsnavigation.com/auth/login
authRouter.post('/login', sanitizer, (req, res, next) => {
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
authRouter.post('/signup', sanitizer, (req, res, next) => {
    passport.authenticate('local-signup', (err, user) => {
        if (err) { return next(err); }
        req.session.save(err => err ? next(err) : res.redirect('/auth'));
    }) (req, res, next);
});

// POST rsnavigation.com/auth/forgot
authRouter.post('/forgot', sanitizer, (req, res, next) => {

    const inputEmail = req.body.email;
    const inputRole = req.body.role;

    let formError = validateForgotPasswordForm(inputEmail, inputRole);
    if (formError) {
        req.flash('message', formError.message);
        return req.session.save(err => err ? next(err) : res.redirect('/auth'));
    }

    let role = inputRole === 'student' ? 0 : 1;

    User.findOne({ 'account.email': inputEmail, 'account.role': role }, 
    (err, user) => {

        if (err) { return next(err); } 

        // if no student account with such email was found
        if (!user) { 
            req.flash('message', 'Email does not exist.');
            return req.session.save(err => err ? next(err) :res.redirect('/auth'));
        }

        // if the student account is still unverified
        if (user.status === 0) {
            req.flash('message', 'Your email address is still unverified. Check your email for the verification link.');
            return req.session.save(err => err ? next(err) :res.redirect('/auth'));
        }

        user.account.hashCode = generate();
        user.save(err => {
            if (err) { return next(err) }

            mailer.sendResetPasswordEmail(user.account, err => {
                if (err) { return next(err) }

                req.flash('message', 'Password reset link has been sent to your email.');
                req.session.save(err => err ? next(err) : res.redirect('/auth'));
            });
        });
    });
});

// POST rsnavigation.com/auth/reset
authRouter.post('/reset', sanitizer, (req, res, next) => {

    if (req.isAuthenticated()) {
        req.flash('message', 'You are still logged in.');
        return req.session.save(err => err ? next(err) : res.redirect('/profile'));
    }

    const id = req.body.id;
    const hashCode = req.body.hashCode;
    const newPassword = req.body.newPassword;
    const confirmNewPassword = req.body.confirmNewPassword;
    

    if (!id || !newPassword || !confirmNewPassword || !hashCode) {
        req.flash('message', 'Missing required fields.');
        return req.session.save(err => err ? next(err) : res.redirect(`/reset/${hashCode}`))
    }

    if (newPassword.length < 8) {
        req.flash('message', 'Password must be at least 8 characters.');
        return req.session.save(err => err ? next(err) : res.redirect(`/reset/${hashCode}`))
    }

    if (confirmNewPassword !== newPassword) {
        req.flash('message', 'Passwords do not match.');
        return req.session.save(err => err ? next(err) : res.redirect(`/reset/${hashCode}`));
    }
    
    User.findOne({ '_id': id, 'hashCode': hashCode, 'status': 1 },
    async (err, user) => {

        logger.info(user);
            
        if (err || !user) { return next(err); }

        user.updatePassword(newPassword, err => { // set reset to true for audit
            if (err) { return next(err); }
            req.flash('message', 'Password updated.');
            req.session.save(err => err ? next(err) : res.redirect('/auth'));
        }, true);
    });
});

module.exports = authRouter;
