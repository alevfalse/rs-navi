// TODO: Refactor this module:
// use schema methods
// remove process.nextTick()
// use switch(id[0])


const authRouter = require('express').Router();
const mailer = require('../../config/mailer');
const passport = require('../../config/passport');
const crypto     = require('crypto');

// Models
const Student = require('../models/student');
const Placeowner = require('../models/placeowner');

// FUNCTIONS ============================================================================

// TODO: Refactor: Use callback, don't handle request/response here
function sendResetPasswordEmail(req, res, next, user, hashCode) {

    const role = user.account.role === 0 ? 'student' : 'placeowner';
    let url = `${process.env.MODE === 'prod' ? 'http://rsnavigation.com' : `localhost:${process.env.PORT}`}/auth/reset/${role}/${hashCode}`;

    const text = `Good day! We have received a password reset request from your ${role} account.\n\n`
        + `You can click this link to reset your password:\n${url}\n\n`
        + `If you did not send this request, we suggest you secure your account by clicking this link anyway or requesting a new one\n`
        + `at http://rsnavigation.com/auth and select Forgot Password. You may also update your password on your account's profile page\n`
        + `if you still have access to it (which we hope that you do). \n\n`
        + `Thank you for using RS Navi.\n- RS Navi Team`;

    const mailOptions = {
        from: "roomstayin.navigation@gmail.com",
        to: user.account.email,
        subject: "RS Navigation - Reset Password",
        text: text
    };
    
    mailer.sendMail(mailOptions, (err, info) => {
        if (err) { return next(err); } // status 500

        req.flash('message', 'Password reset link has been sent to your email.');
        req.session.save((err) => {
            if (err) { return next(err); } // status 500
            res.redirect('/auth');
        });
    });
}

// TODO: Refactor: Use callback, don't handle request/response here
function sendEmailVerification(req, res, next, user, hashCode) {

    const role = user.account.role === 0 ? 'student' : 'placeowner';
    let url = `${process.env.MODE === 'prod' ? 'http://rsnavigation.com' : `localhost:${process.env.PORT}`}/auth/verify/${role}/${hashCode}`;

    const text = `Congratulations! You have successfully created an RS Navigation ${role} account and you are just one step away from acessing it.\n\n`
        + `You can click this link to verify that this is indeed your email address:\n${url}\n\n`
        + `If you do not remember signing up to http://rsnavigation.com, calm down. Don't panic.\n`
        + `Just ignore this email and we will handle the rest.\n\n`
        + `- RS Navi Team`;

    const mailOptions = {
        from: "roomstayin.navigation@gmail.com",
        to: user.account.email,
        subject: "RS Navigation - Email Verification",
        text: text
    };
    
    mailer.sendMail(mailOptions, (err, info) => {
        if (err) { return next(err); } // status 500

        console.log(`Email sent: ${info.response}`);
        req.flash('message', 'Verification link has been sent to your email.');
        req.session.save((err) => {
            if (err) { return next(err); } // status 500
            res.redirect('/auth');
        });
    });
}

function validateForgotPasswordForm(inputEmail, role) {

    let errorMessage = '';

    if (!inputEmail) {
        errorMessage += 'No email address provided.\n';
    } else if (!role) {
        errorMessage += 'No role provided.\n';
    } else if (inputEmail.startsWith(' ')) {
        errorMessage += 'Email address must not start with space.\n';
    } else if (inputEmail.match(/[^a-zA-Z0-9.@_]/)) {
        errorMessage += 'Email address contains an invalid character.\n';
    } else if (inputEmail.length == 0) {
        errorMessage += 'Email address cannot be empty.\n';
    } else if (inputEmail.length > 50) {
        errorMessage += 'Email address must not be more than 50 characters.\n';
    } // regex: if email starts/ends with @ or period || 2 or more @ || an @ is preceded by a period
    else if (!inputEmail.includes('@') || inputEmail.match(/[@.]$|^[@.]|@[^@]*@|\.@/)) {
        errorMessage += 'Invalid email address.\n';
    }

    return (errorMessage.length > 0 ? new Error(errorMessage) : null);
}


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

    // TODO: Use schema methods
    switch (role.toLowerCase())
    {
    case 'student': {
        // Find one student with the provided hash code, has a status of unverified and a role of student
        Student.findOne({ 'account.hashCode': hashCode, 'account.status': 0, 'account.role': 0 }, (err, student) => {
            if (err) { return next(err); } // status 500

            // if no student was found with the given hash code
            if (!student) {
                req.flash('message', 'Invalid verification link.');
                return req.session.save((err) => {
                    if (err) { return next(err); }
                    res.redirect('/auth');
                });
            }

            // If the student exists, set their hash code to null and status to verified
            student.account.hashCode = null;
            student.account.status = 1;
            student.account.lastLoggedIn = new Date();

            // Update student in the database
            student.save((err) => {
                if (err) { return next(err); } // status 500

                // Authenticate the student and bind it to request as req.user
                req.login(student, (err) => {
                    if (err) { return next(err); } // status 500

                    req.flash('message', 'Email address verified.')
                    req.session.save((err) => {
                        if (err) { return next(err); } // status 500
                        res.redirect('/profile');
                    });
                });
            });
        });
    } break;

    case 'placeowner': {
        process.nextTick(() => {

            // Find one placeowner with the provided hash code, has a status of unverified and a role of placeowner
            Placeowner.findOne({ 'account.hashCode': hashCode, 'account.status': 0, 'account.role': 1 }, (err, placeowner) => {
                if (err) { return next(err); } // status 500

                if (!placeowner) {
                    req.flash('message', 'Invalid verification link.');
                    return req.session.save((err) => {
                        if (err) { return next(err); }
                        res.redirect('/auth');
                    });
                }

                // If the placeowner exists, set their hash code to null and status to verified
                placeowner.account.hashCode = null;
                placeowner.account.status = 1;
                placeowner.account.lastLoggedIn = new Date();

                // Update placeowner in the database
                placeowner.save((err) => {
                    if (err) { return next(err); } // status 500

                    // Authenticate the placeowner and bind it to request as req.user
                    req.logIn(placeowner, (err) => {
                        if (err) { return next(err); } // status 500

                        req.flash('message', 'Email address verified.')
                        return req.session.save((err) => {
                            if (err) { return next(err); }
                            res.redirect('/profile');
                        });
                    });
                });
            });
        });
    } break;

    default: return next(); // status 404
    }
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

    switch (role.toLowerCase())
    {
    case 'student': {
        process.nextTick(() => {

            Student.findOne({ 'account.hashCode': hashCode, 'account.status': 1, 'account.role': 0 }, (err, student) => {

                if (err) { return next(err); } // status 500
                if (!student) { return next(); } // status 404
    
                req.session.save((err) => {
                    if (err) { return next(err); } // status 500

                    res.render('reset', 
                    { message: req.flash('message'), email: student.account.email, role: role, hashCode: hashCode }, 
                    (err, html) => {
                        if (err) { return next(err); } // status 500
                        res.send(html);
                    });
                });
            });
        });
    } break;

    case 'placeowner': {
        process.nextTick(() => {

            Placeowner.findOne({ 'account.hashCode': hashCode, 'account.status': 1, 'account.role': 1 }, (err, placeowner) => {

                if (err) { return next(err); } // status 500
                if (!student) { return next(); } // status 404

                req.session.save((err) => {
                    if (err) { return next(err); } // status 500

                    res.render('reset', 
                    { message: req.flash('message'), email: placeowner.account.email, role: role, hashCode: hashCode },
                    (err, html) => {
                        if (err) { return next(err); } // status 500
                        res.send(html);
                    });
                });
            });
        });
    } break;
        

    default: 
        return next(); // status 404
    }
})

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

        crypto.randomBytes(10, (err, buffer) => {
            if (err) { return next(err); } // status 500

            const hashCode = buffer.toString('hex');
            user.account.hashCode = hashCode;

            user.save((err) => {
                if (err) { return next(err); } // status 500
                sendEmailVerification(req, res, next, user, hashCode);
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
