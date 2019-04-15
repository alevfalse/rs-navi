// TODO: Refactor this module:
// use schema methods
// remove process.nextTick()
// use switch(id[0])

const authRouter = require('express').Router();
const passport = require('../../config/passport');
const crypto = require('crypto');

// models
const Student = require('../models/student');
const Placeowner = require('../models/placeowner');

// FUNCTIONS ============================================================================

const sendVerificationLink = require('../../bin/verification-email');
const sendResetPasswordEmail = require('../../bin/password-reset-email');

// MIDDLEWARES ===========================================================================

// checks if client is already authenticated
function isAuthenticated(req, res, next) {

    // redirect to profile/admin page if already logged in
    if (req.isAuthenticated()) {
        if (req.user.account.role === 7) {
            res.redirect('/admin');
        } else {
            res.redirect('/profile')
        }
    } else {
        next();
    }
}



// =======================================================================================
// GET ROUTES ============================================================================

// GET rsnavigation.com/auth/
authRouter.get('/', isAuthenticated, (req, res, next) => {
    const options = {
        user: req.user,
        message: req.flash('message'),
        placeowner: parseInt(req.query.placeowner) === 1 ? 1 : null
    }

    res.render('auth', options, (err, html) => {
        if (err) { return next(err); }
        res.send(html);
    });
})

// GET rsnavigation.com/auth/logout
authRouter.get('/logout', (req, res) => {

    if (req.isAuthenticated()) {
        req.logout();
        req.flash('message', 'Logged out.');
    }
    
    // redirect to auth page regardless if client is logged in or not
    req.session.save((err) => {
        if (err) { return next(err); }
        res.redirect('/');
    });
})

// GET rsnavigation.com/verify/<role>/<hashCode>
authRouter.get('/verify/:role/:hashCode', (req, res, next) => {

    if (req.isAuthenticated()) {
        req.flash('Please log out before verifying an email address.');
        return req.session.save((err) => {
            if (err) { return next(err); }
            res.redirect('/profile');
        });
    }

    const role = req.params.role;
    const hashCode = req.params.hashCode;
    if (!role || !hashCode) { return next(); } // status 404

    let query;

    switch (role)
    {
        case '0': query = Student.findOne(); break;
        case '1': query = Student.findOne(); break;
        default: return next();
    }

    query.where({ 'account.hashCode': hashCode, 'account.status': 0 })
    .exec((err, user) => {
        if (err) { return next(err); } // status 500

        // if no student was found with the given hash code
        if (!user) {
            req.flash('message', 'Invalid verification link.');
            return req.session.save((err) => {
                if (err) { return next(err); }
                res.redirect('/auth');
            });
        }

        user.verifyEmail((err) => {
            if (err) { return next(err); }
            res.redirect('/profile');
        });
    });
})

// GET rsnavigation.com/reset/<role>/<hashCode>
authRouter.get('/reset/:role/:hashCode', (req, res, next) => {

    if (req.isAuthenticated()) {
        req.flash('You must be loggged out before resetting a forgotten password.');
        return req.session.save((err) => {
            if (err) { return next(err); } // status 500
            res.redirect('/profile');
        }); 
    }

    const role = req.params.role;
    const hashCode = req.params.hashCode;
    if (!role || !hashCode) { return next(); } // status 404 

    let query;

    switch (role)
    {
        case '0': query = Student.findOne(); break;
        case '1': query = Placeowner.findOne(); break;
        default: return next();
    }
    
    query.where({ 'account.hashCode': hashCode, 'account.status': 1 })
    .exec((err, user) => {
        if (err || !user) { return next(err); }

        req.session.save((err) => {
            if (err) { return next(err); } // status 500

            res.render('reset', 
            { 'message': req.flash('message'), 'email': user.account.email, 'role': role, 'hashCode': hashCode }, 
            (err, html) => err ? next(err) : res.send(html));
        });
    });
});

// ========================================================================================
// POST ROUTES ============================================================================

// POST rsnavigation.com/auth/login
authRouter.post('/login', (req, res, next) => {
    passport.authenticate('local-login', (err, user) => {

        if (err) { return next(err); }

        if (!user) {
            return req.session.save((err) => {
                if (err) { return next(err); } // status 500
                res.redirect('/auth');
            });
        }

        req.logIn(user, (err) => {
            if (err) { return next(err); } // status 500
                
            req.session.save((err) => {
                if (err) { return next(err); } // status 500
                res.redirect('/profile');
            });
        });
    }) (req, res, next);
});


// POST rsnavigation.com/auth/signup
authRouter.post('/signup', (req, res, next) => {
    passport.authenticate('local-signup', (err, user) => {

        if (err) { return next(err); } // status 500

        if (!user) {
            return req.session.save((err) => {
                if (err) { return next(err); } // status 500
                res.redirect('/auth');
            });
        }

        // TODO: Refactor use user id on verification link
        crypto.randomBytes(3, (err, buffer) => {
            if (err) { return next(err); } // status 500

            const hashCode = buffer.toString('hex');
            user.account.hashCode = hashCode;

            user.save((err) => {
                if (err) { return next(err); } // status 500
                sendVerificationLink(req, user, hashCode, (err) => {
                    if (err) { return next(err); }
                    res.redirect('/auth');
                });
            });
        });
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

    switch (inputRole.toLowerCase())
    {
    case 'student': {
        process.nextTick(() => {

            Student.findOne({ 'account.email': inputEmail, 'account.role': 0 }, (err, student) => {

                if (err) { return next(err); } // status 500

                // if no student account with such email was found
                if (!student) { 
                    req.flash('message', 'Student email does not exist.');
                    return req.session.save((err) => {
                        if (err) { return next(err); } // status 500
                        res.redirect('/auth');
                    });
                }

                // if the student account is still unverified
                if (student.account.status === 0) {
                    req.flash('message', 'Your email address is still unverified. Check your email for the verification link.');
                    return req.session.save((err) => {
                        if (err) { return next(err); } // status 500
                        res.redirect('/auth');
                    });
                }

                // generate hash code and save to student's account
                crypto.randomBytes(6, (err, buffer) => {
                    if (err) { return next(err); } // status 500

                    const hashCode = buffer.toString('hex');
                    student.account.hashCode = hashCode;
                    student.save((err) => {
                        if (err) { return next(err); } // status 500
                        sendResetPasswordEmail(req, res, next, student, hashCode);
                    });
                });
            });
        });
    } break;

    case 'placeowner':
        process.nextTick(() => {

            Placeowner.findOne({ 'account.email': inputEmail, 'account.role': 1 }, (err, placeowner) => {

                if (err) { return next(err); } // status 500

                // if no placeowner with such email was found
                if (!placeowner) {
                    req.flash('message', 'Placeowner email does not exist.');
                    return req.session.save((err) => {
                        if (err) { return next(err); } // status 500
                        res.redirect('/auth');
                    });
                }

                // if the placeowner account is still unverefied
                if (placeowner.account.status === 0) {
                    req.flash('message', 'Your email address is still unverified. Check your email for the verification link.');
                    return req.session.save((err) => {
                        if (err) { return next(err); } // status 500
                        res.redirect('/auth');
                    });
                }

                crypto.randomBytes(6, (err, buffer) => {
                    if (err) { return next(err); } // status 500

                    const hashCode = buffer.toString('hex');
                    placeowner.account.hashCode = hashCode;
                    placeowner.save((err) => {
                        if (err) { return next(err); } // status 500
                        sendResetPasswordEmail(req, res, placeowner, hashCode);
                    });
                });
            });
        });
        break;

    default:
        req.flash('message', 'Invalid credentials provided.'); // invalid role
        req.session.save((err) => {
            if (err) { return next(err); }
            res.redirect('/auth');
        });
    }
});

// POST rsnavigation.com/auth/reset
authRouter.post('/reset', (req, res, next) => {

    if (req.isAuthenticated()) {
        req.flash('message', 'You must log out first before resetting forgotten password.');
        return req.session.save((err) => {
            if (err) { return next(err); } // status 500
            res.redirect('/profile');
        });
    }

    const email = req.body.email;
    const newPassword = req.body.newPassword;
    const confirmNewPassword = req.body.confirmNewPassword;
    const role = req.body.role;
    const hashCode = req.query.hashCode;

    if (!email || !newPassword || !confirmNewPassword || !role || !hashCode) {
        req.flash('message', 'Missing required fields.');
        return req.session.save((err) => {
            if (err) { return next(err); } // status 500
            res.redirect('/auth');
        })
    }

    if (confirmNewPassword !== newPassword) {
        req.flash('message', 'Passwords do not match.');
        return req.session.save((err) => {
            if (err) { return next(err); } // status 500
            res.redirect('/auth');
        });
    }

    switch (role.toLowerCase())
    {
    case 'student': {
        Student.findOne({ 'account.email': email, 'account.hashcode': hashCode, 'account.status': 1 }, (err, student) => {
            
            if (err) { return next(err); } // status 500

            if (!student) {
                req.flash('message', 'Invalid credentials.');
                return req.session.save((err) => {
                    if (err) { return next(err); } // status 500
                    res.redirect('/auth');
                });
            }

            student.account.password = newPassword;
            student.account.haschCode = null;

            student.save((err) => {
                if (err) { return next(err); } // status 500

                req.flash('message', 'Password updated.');
                req.session.save((err) => {
                    if (err) { return next(err); } // status 500
                    res.redirect('/auth');
                });
            });
        });
    } break;

    case 'placeowner': {
        Placeowner.findOne({ 'account.email': email, 'account.hashcode': hashCode, 'account.status': 1 }, (err, placeowner) => {
            
            if (err) { return next(err); } // status 500

            if (!placeowner) {
                req.flash('message', 'Invalid credentials.');
                return req.session.save((err) => {
                    if (err) { return next(err); } // status 500
                    res.redirect('/auth');
                });
            }

            placeowner.account.password = newPassword;
            placeowner.account.hashCode = null;

            placeowner.save((err) => {
                if (err) { return next(err); }

                req.flash('message', 'Password updated.');
                req.session.save((err) => {
                    if (err) { return next(err); } // status 500
                    res.redirect('/auth');
                });
            });
        });
    }   break;

    default: 
        req.flash('message', 'Invalid credentials.'); // invalid role
        req.session.save((err) => {
            if (err) { return next(err); } // status 500
            res.redirect('/auth');
        });
    }
});

module.exports = authRouter;
