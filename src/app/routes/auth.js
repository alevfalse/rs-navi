const authRouter = require('express').Router();
const passport = require('../../config/passport');
const nanoid = require('../../bin/nanoid');

// model
const Account = require('../models/account');
const Audit = require('../models/audit');

// FUNCTIONS ============================================================================
const sendResetPasswordEmail = require('../../bin/password-reset-email');
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
        placeowner: parseInt(req.query.placeowner) === 1 ? 1 : null // if add a place was clicked while not logged in
    }

    res.render('auth', options, (err, html) => err ? next(err) : res.send(html));
})

// GET rsnavigation.com/auth/logout
authRouter.get('/logout', (req, res) => {
    const id = req.user._id;

    if (req.isAuthenticated()) {
        req.logout();
        req.flash('message', 'Logged out.');
    }
    
    req.session.save(err => err ? next(err) : res.redirect('/auth'));
    new Audit({ executor: id, action: 5, actionType: 'UPDATE' }).save(console.error);
})

// GET rsnavigation.com/verify/<id>/<hashCode>
authRouter.get('/verify/:id/:hashCode', (req, res, next) => {

    if (req.isAuthenticated()) {
        req.flash('message', 'You are still logged in.');
        return req.session.save(err => err ? next(err) : res.redirect('/profile'));
    }

    console.log(req.params);

    const id = req.params.id;
    const hashCode = req.params.hashCode;

    if (!id || !hashCode) { return next(); } // status 404

    Account.findOne({ '_id': id, 'hashCode': hashCode, 'status': 0 },
    (err, account) => {
        if (err || !account) { return next(err); }

        account.verifyEmail(err => {
            if (err) { return next(err); }

            req.login(account, err => {
                if (err) { return next(err); } // status 500
                req.flash('message', 'Verified email address.');
                req.session.save(err => err ? next(err) : res.redirect('/profile'));
                new Audit({ executor: account._id, action: 1, actionType: 'UPDATE' }).save(console.error);
            });
        });
    });
});

// GET rsnavigation.com/reset/<role>/<hashCode>
authRouter.get('/reset/:id/:hashCode', (req, res, next) => {

    if (req.isAuthenticated()) {
        req.flash('message', 'You are still logged in.');
        return req.session.save(err => err ? next(err) : res.redirect('/profile'));
    }

    const id = req.params.id;
    const hashCode = req.params.hashCode;

    if (!id || !hashCode) { return next(); } // status 404 

    Account.findOne({ 'hashCode': hashCode, '_id': id, 'status': 1 },
    (err, account) => {
        if (err || !account) { return next(err); } // status 500

        res.render('reset', { 'message': req.flash('message'), 'account': account }, 
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
            if (err) { return next(err); } // status 500
            req.session.save(err => err ? next(err) : res.redirect('/profile'));
            new Audit({ executor: user._id, action: 4, actionType: 'ACCESSED' }).save(console.error);
        });
    }) (req, res, next);
});

// POST rsnavigation.com/auth/signup
authRouter.post('/signup', (req, res, next) => {
    passport.authenticate('local-signup', (err, user) => {
        if (err) { return next(err); } // status 500
        req.session.save(err => err ? next(err) : res.redirect('/auth'));
        if (user) { new Audit({ executor: user._id, action: 0, actionType: 'CREATE' }).save(console.error); }
    }) (req, res, next);
});

// POST rsnavigation.com/auth/forgot
authRouter.post('/forgot', (req, res, next) => {

    const inputEmail = req.body.email;
    const inputRole = req.body.role;

    let formError = validateForgotPasswordForm(inputEmail, inputRole);
    if (formError) {
        req.flash('message', formError.message);
        return req.session.save((err) => {
            if (err) { return next(err); } // status 500
            res.redirect('/auth');
        });
    }

    let role = inputRole === 'student' ? 0 : 1;

    Account.findOne({ 'email': inputEmail, 'role': role }, 
    (err, account) => {

        if (err) { return next(err); } // status 500

        // if no student account with such email was found
        if (!account) { 
            req.flash('message', 'Email does not exist.');
            return req.session.save(err => err ? next(err) :res.redirect('/auth'));
        }

        // if the student account is still unverified
        if (account.status === 0) {
            req.flash('message', 'Your email address is still unverified. Check your email for the verification link.');
            return req.session.save(err => err ? next(err) :res.redirect('/auth'));
        }

        const oldHashCode = account.hashCode;
        account.hashCode = nanoid(6);

        account.save(err => {
            if (err) { return next(err) }

            sendResetPasswordEmail(account, err => {
                if (err) { return next(err) }

                req.flash('message', 'Password reset link has been sent to your email.');
                req.session.save(err => err ? next(err) : res.redirect('/auth'));
                
                new Audit({ executor: account._id, actionType: 'UPDATE', action: 2,
                    changes: { key: 'hashCode', old: oldHashCode, new: account.hashCode }, 
                }).save(console.error);
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

    const id = req.body.id;
    const hashCode = req.body.hashCode;
    const newPassword = req.body.newPassword;
    const confirmNewPassword = req.body.confirmNewPassword;
    

    if (!id || !newPassword || !confirmNewPassword || !hashCode) {
        req.flash('message', 'Missing required fields.');
        return req.session.save(err => err ? next(err) : res.redirect('/auth'))
    }

    if (confirmNewPassword !== newPassword) {
        req.flash('message', 'Passwords do not match.');
        return req.session.save(err => err ? next(err) : res.redirect('/auth'));
    }
    
    Account.findOne({ '_id': id, 'hashCode': hashCode, 'status': 1 },
    async (err, account) => {

        console.log(account);
            
        if (err || !account) { return next(err); }

        account.updatePassword(newPassword, err => {
            if (err) { return next(err); }
            req.flash('message', 'Password updated.');
            req.session.save(err => err ? next(err) : res.redirect('/auth'));
            
            new Audit({ executor: account._id, action: 3, actionType: 'UPDATE', changes: { key: 'password' } }).save(console.error);
        });
    });
});

module.exports = authRouter;
