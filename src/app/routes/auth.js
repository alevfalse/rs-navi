const authRouter = require('express').Router();
const mailer = require('../../config/mailer');
const passport = require('../../config/passport');

// Models
const Student = require('../models/student');
const Placeowner = require('../models/placeowner');

function generateHashCode(str) {

    let hash = 0, i, chr;

    try {
        if (str.length === 0) return hash;

        for (i = 0; i < str.length; i++) {
            chr   = str.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
    } catch (err) {
        console.error(err);
        return err;
    }
    
    return hash;
}

// ========================================================================================
// GET ROUTES ============================================================================

// rsnavigation.com/auth/
authRouter.get('/', (req, res) => {

    // prevent user from accessing authentication page if already logged in
    if (req.isAuthenticated()) {
        req.flash('message', 'You are already logged in.');
        req.session.save((err) => {
            if (err) { console.error(err); }
            res.redirect('/');
        })
    } else {
        res.render('auth', { user: req.user, message: req.flash('message') },
            (err, html) => {
                if (err) { 
                    console.error(err);
                    return res.sendStatus(500); 
                }
                res.send(html);
            }
        );
    }
})

// rsnavigation.com/auth/logout
authRouter.get('/logout', (req, res) => {

    // check if user is logged in first
    if (req.isAuthenticated()) {
        req.logout();
        req.flash('message', 'Successfully logged out.');
        req.session.save((err) => {
            if (err) { console.error(err); }
            res.redirect('/auth');
        });
    } else {
        req.flash('message', 'You are not logged in.');
        req.session.save((err) => {
            if (err) { console.error(err); }
            res.redirect('/auth');
        });
    }
})

// forgot password
authRouter.get('/reset/:role/:hashCode', (req, res) => {

    if (req.isAuthenticated()) {
        req.flash('You must be loggged out before resetting a forgotten password.');
        req.session.save((err) => {
            if (err) { console.error(err) };
            res.redirect('/');
        })
        return;
    }

    const role = req.params.role;
    const hashCode = req.params.hashCode;

    if (!role || !hashCode) {
        console.error('Missing required input fields.');
        req.flash('message', 'Page not found.');
        req.session.save((err) => {
            if (err) { console.error(err); }
            res.redirect('/');
        })
        return;
    }

    switch (role.toLowerCase())
    {
    case 'student':
        process.nextTick(() => {
            Student.findOne({ 'account.hashCode': hashCode }, (err, student) => {
    
                if (err) {
                    console.error(`An error occurred while querying for hash code of student:\n${err}`);
                    req.flash('message', 'An error occurred. Please try again later.');
                    req.session.save((err) => {
                        if (err) { console.error(err) };
                        res.redirect('/auth');
                    })
                    return;
                }
    
                if (!student) {
                    req.flash('message', 'Page not found.');
                    req.session.save((err) => {
                        if (err) { console.error(err); }
                        res.redirect('/');
                    })
                    return;
                }
    
                res.render('reset', { message: req.flash('message'), email: student.account.email, role: role, hashCode: hashCode }, 
                    (err, html) => {
                        if (err) { 
                            console.error(err);
                            return res.sendStatus(500); 
                        }
                        res.send(html);
                    }
                );
            })
        })
        break;

    case 'placeowner':
        process.nextTick(() => {
            Placeowner.findOne({ 'account.hashCode': hashCode }, (err, placeowner) => {
                if (err) {
                    console.error(`An error occurred while querying for hash code of Placeowner [${placeowner.account.email}]:\n${err}`);
                    req.flash('message', 'An error occurred. Please try again later.');
                    req.session.save((err) => {
                        if (err) { console.error(err); }
                        res.redirect('/auth');
                    })
                    return;
                }
    
                if (!placeowner) {
                    req.flash('message', 'Page not found.');
                    req.session.save((err) => {
                        if (err) { console.error(err); }
                        res.redirect('/');
                    })
                    return;
                }
    
                console.log(placeowner);
                res.render('reset', { message: req.flash('message'), email: placeowner.account.email, role: role, hashCode: hashCode },
                    (err, html) => {
                        if (err) { 
                            console.error(err);
                            return res.sendStatus(500); 
                        }
                        res.send(html);
                    }
                );
            })
        })
        break;

    default: 
        req.flash('message', 'Page not found.');
        req.session.save((err) => {
            if (err) { console.error(err); }
            res.redirect('/');
        })
    }
})

// ========================================================================================
// POST ROUTES ============================================================================

// rsnavigation.com/auth/login
authRouter.post('/login', (req, res, next) => {
    passport.authenticate('local-login', (err, user) => {

        // if an error occurred or no user is found with the provided credentials
        if (err || !user) {
            req.session.save((err) => {
                if (err) { console.error(err); }
                res.redirect('/auth');
            })
            return;
        }

        req.logIn(user, (err) => {
            if (err) { 
                console.error(err);
                req.flash('message', 'Failed to log in. Please try again later.');
                req.session.save((err) => {
                    if (err) { console.error(err); }
                    res.redirect('/auth');
                })
            } else {
                req.session.save((err) => {
                    if (err) { console.error(err); }
                    res.redirect('/profile');
                }) 
            }
        });
    }) (req, res, next);
});

// rsnavigation.com/auth/signup
authRouter.post('/signup', (req, res, next) => {
    passport.authenticate('local-signup', (err, user) => {

        if (err) { console.error(err); }

        req.session.save((err) => {
            if (err) { return next(err); }
            return res.redirect('/auth');
        })
        
    }) (req, res, next);
});


function getHashCode(email) {
    const unhashedString = email + process.env.HASH_CODE_SALT  + new Date().toUTCString();
    return Math.abs(generateHashCode(unhashedString));
}

function sendResetCodeEmail(recepientEmail, hashCode, user, role, req, res) {

    let url = `${process.env.mode == 'dev' ? `localhost:${process.env.PORT}` : 'http://rsnavigation.com'}/auth/reset/${role}/${hashCode}`
    const text = `Good day! We have received a password reset request from your account at ${Date()}.\n\n`
        + `You can click this link to reset your password:\n${url}\n\n`
        + `If you did not send this request, we suggest you secure your account by clicking this link anyway or requesting a new one\n`
        + `at http://rsnavigation.com/auth and select Forgot Password. You may also update your password on your account's profile page\n`
        + `if you still have access to it (which we hope that you do). \n\n`
        + `Thank you for using RS Navi.\n- RS Navi Team`;

    const mailOptions = {
        from: "roomstayin.navigation@gmail.com",
        to: recepientEmail,
        subject: "RS Navigation - Reset Password",
        text: text
    };
    
    mailer.sendMail(mailOptions, (err, info) => {

        if (err) {
            console.error(`An error occurred while sending password reset email to ${recepientEmail}:\n${err}`);
            req.flash('message', 'Failed to send password reset link to your email. Please try again later.');
            req.session.save((err) => {
                if (err) { console.error(err); }
                user.account.hashCode = null;
                user.save((err) => {
                    if (err) { console.error(`An error occurred while deleting hashCode of ${user.account.email}:\n${err}`); }
                    res.redirect('/auth');
                });
            })
        } else {
            console.log(`Email sent: ${info.response}`);
            req.flash('message', 'Successfully sent password reset link to your email.');
            req.session.save((err) => {
                if (err) { console.error(err) }
                return res.redirect('/auth');
            })
        }
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

    if (errorMessage.length > 0) {
        return new Error(errorMessage);
    } else {
        return null;
    }
}
// rsnavigation.com/auth/forgot
authRouter.post('/forgot', (req, res) => {
    const inputEmail = req.body.email;
    const inputRole = req.body.role;

    let formError = validateForgotPasswordForm(inputEmail, inputRole);
    if (formError) {
        req.flash('message', formError.message);
        req.session.save((err) => {
            if (err) { console.error(err); }
            res.redirect('/auth');
        })
        return;
    }

    switch (inputRole.toLowerCase())
    {
    case 'student':
        process.nextTick(() => {

            Student.findOne({ 'account.email': inputEmail }, (err, student) => {

                if (err) {
                    console.error(`An error occurred while querying student email [${inputEmail}]`);
                    req.flash( 'message', 'An error occurred. Please try again later.');
                    req.session.save((err) => {
                        if (err) { console.error(err); }
                        res.redirect('/auth');
                    })
                    return;
                }
        
                if (!student) {
                    req.flash('message', 'Student email does not exist.');
                    req.session.save((err) => {
                        if (err) { console.error(err); }
                        res.redirect('/auth');
                    })
                    return;
                }

                if (student.account.status == 0) {
                    req.flash('message', 'Your email address is still unverified.');
                    req.session.save((err) => {
                        if (err) { console.error(err); }
                        res.redirect('/auth');
                    })
                    return;
                }

                const hashCode = getHashCode(student.account.email);
                console.log(`Generated Hash Code: ${hashCode}`);
                student.account.hashCode = hashCode;
                student.save((err) => {
                    if (err) {
                        console.error(`An error occurred while saving student ${inputEmail}:\n${err}`);
                        req.flash('message', 'An error occurred. Please try again later.');
                        req.session.save((err) => {
                            if (err) { console.error(err); }
                            res.redirect('/auth');
                        })
                        return;
                    }

                    sendResetCodeEmail(student.account.email, hashCode, student, 'student', req, res);
                })
            })
        });
        break;

    case 'placeowner':
        process.nextTick(() => {
            Placeowner.findOne({ 'account.email': inputEmail }, (err, placeowner) => {

                if (err) {
                    console.error(`An error occurred while querying placeowner email [${inputEmail}]`);
                    req.flash('message', 'An error occurred. Please try again later.');
                    req.session.save((err) => {
                        if (err) { console.error(err); }
                        res.redirect('/auth');
                    });
                    return;
                }

                if (!placeowner) {
                    req.flash('message', 'Placeowner email does not exist.');
                    req.session.save((err) => {
                        if (err) { console.error(err); }
                        res.redirect('/auth');
                    })
                    return;
                }

                if (placeowner.account.status == 0) {
                    req.flash('message', 'Your email address is still unverified.');
                    req.session.save((err) => {
                        if (err) { console.error(err); }
                        res.redirect('/auth');
                    })
                    return;
                }

                const hashCode = getHashCode(placeowner.account.email);
                placeowner.account.hashCode = hashCode;
                placeowner.save((err) => {
                    if (err) {
                        console.error(`An error occurred while saving placeowner ${inputEmail}:\n${err}`);
                        req.flash('message', 'An error occurred. Please try again later.');
                        req.session.save((err) => {
                            if (err) { console.error(err); }
                            res.redirect('/auth');
                        })
                        return;
                    }

                    sendResetCodeEmail(placeowner.account.email, hashCode, placeowner, 'placeowner', req, res);
                });
            });
        });
        break;

    default:
        req.flash('message', 'Invalid role provided.');
        req.session.save((err) => {
            if (err) { console.error(err); }
            res.redirect('/auth');
        })
    }
})

// forgot password
authRouter.post('/reset', (req, res) => {

    if (req.isAuthenticated()) {
        req.flash('message', 'You must log out first before resetting forgotten password.');
        req.session.save((err) => {
            if (err) { console.error(err); }
            res.redirect('/');
        })
        return;
    }

    const email = req.body.email;
    const newPassword = req.body.newPassword;
    const confirmNewPassword = req.body.confirmNewPassword;
    const role = req.body.role;
    const hashCode = req.query.hashCode;

    
    if (confirmNewPassword !== newPassword) {
        const err = new Error('Passwords do not match.');
        console.error(err);
        req.flash('message', err.message);
        req.session.save((err) => {
            if (err) { console.error(err); }
            res.redirect('/auth');
        })
        return;
    }

    switch (role.toLowerCase())
    {
    case 'student':
        Student.findOne({ 'account.email': email, 'account.hashcode': hashCode }, (err, student) => {
            if (err) {
                console.error(`An error occurred while querying for hash code of student email [${email}]:\n${err}`);
                req.flash('message', 'An error occurred. Please try again later.');
                req.session.save((err) => {
                    if (err) { console.error(err); }
                    res.redirect('/auth');
                })
                return;
            }

            if (!student) {
                req.flash('message', 'An error occurred. Please try again later.');
                req.session.save((err) => {
                    if (err) { console.error(err); }
                    res.redirect('/auth');
                })
                return;
            }

            student.account.password = newPassword;
            student.account.haschCode = null;

            student.save((err) => {
                if (err) {
                    console.error(`An error occurred while saving Student ${student.account.email}'s new password.`);
                    req.flash('message', 'Failed to update you password. Please try again later.');
                    req.session.save((err) => {
                        if (err) { console.error(err); }
                        res.redirect('/auth');
                    })
                    return;
                }

                req.flash('message', 'Password update successful.');
                req.session.save((err) => {
                    if (err) { console.error(err); }
                    res.redirect('/auth');
                })
            })
        })
        break;

    case 'placeowner':
        Placeowner.findOne({ 'account.email': email, 'account.hashcode': hashCode }, (err, placeowner) => {
            if (err) {
                console.error(`An error occurred while querying for hash code of placeowner email [${email}]:\n${err}`);
                req.flash('message', 'An error occurred. Please try again later.');
                req.session.save((err) => {
                    if (err) { console.error(err); }
                    res.redirect('/auth');
                })
                return;
            }

            if (!placeowner) {
                console.error(`Invalid POST request for placeowner password reset.`);
                return res.sendStatus(404);
            }

            placeowner.account.password = newPassword;
            placeowner.account.hashCode = null;
            placeowner.save((err) => {
                if (err) {
                    console.error(`An error occurred while saving Placeowner ${placeowner.account.email}'s new password.`);
                    req.flash('message', 'An error occurred. Failed to update you password.');
                    req.session.save((err) => {
                        if (err) { console.error(err); }
                        res.redirect('/auth');
                    })
                    return;
                } else {
                    req.flash('message', 'Password update successful.');
                    req.session.save((err) => {
                        if (err) { console.error(err); }
                        res.redirect('/auth');
                    })
                    return;
                }
            })
        })
        break;

    default: res.sendStatus(404);
    }
})

authRouter.get('/*', (req, res) => {
    req.flash('message', 'Page not found.');
    req.session.save((err) => {
        if (err) { console.error(err); }
        res.redirect('/');
    })
})

module.exports = authRouter;