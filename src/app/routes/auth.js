const authRouter = require('express').Router();
const mailer = require('../../config/mailer');
const passport = require('../../config/passport');
const crypto     = require('crypto');

// Models
const Student = require('../models/student');
const Placeowner = require('../models/placeowner');

// FUNCTIONS ============================================================================
function sendResetPasswordEmail(req, res, user, hashCode) {

    const role = user.account.role == 0 ? 'student' : 'placeowner';

    let url = `${process.env.mode == 'dev' ? `localhost:${process.env.PORT}` : 'http://rsnavigation.com'}/auth/reset/${role}/${hashCode}`;

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

        if (err) {
            console.error(`An error occurred while sending password reset email to ${user.account.email}:\n${err}`);
            user.account.hashCode = null;
            user.save((err) => {
                if (err) { console.error(`An error occurred while deleting hashCode of ${user.account.email}:\n${err}`); }
                req.flash('message', 'Failed to send password reset link to your email. Please try again later.');
                req.session.save((err) => {
                    if (err) { console.error(err); }
                    res.redirect('/auth');
                });
            });
            
        } else {
            console.log(`Email sent: ${info.response}`);
            req.flash('message', 'Password reset link has been sent to your email.');
            req.session.save((err) => {
                if (err) { console.error(err) }
                res.redirect('/auth');
            });
        }
    });
}

function sendEmailVerification(req, res, user, hashCode) {

    const role = user.account.role == 0 ? 'student' : 'placeowner';
    let url = `${process.env.mode == 'dev' ? `localhost:${process.env.PORT}` : 'http://rsnavigation.com'}/auth/verify/${role}/${hashCode}`;

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

        if (err) {
            console.error(`An error occurred while sending verification link to ${user.account.email}:\n${err}`);
            user.account.hashCode = null;
            user.save((err) => {
                if (err) { console.error(`An error occurred while deleting hashCode of ${user.account.email}:\n${err}`); }
                req.flash('message', 'Failed to send verification link to your email. Please try again later.');
                req.session.save((err) => {
                    if (err) { console.error(err); }
                    res.redirect('/auth');
                });
            });
        } else {
            console.log(`Email sent: ${info.response}`);
            req.flash('message', 'Verification link has been sent to your email.');
            req.session.save((err) => {
                if (err) { console.error(err) }
                res.redirect('/auth');
            });
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

// =======================================================================================
// GET ROUTES ============================================================================

// rsnavigation.com/auth/
authRouter.get('/', (req, res) => {

    // prevent user from accessing authentication page if already logged in
    if (req.isAuthenticated()) {
        req.flash('message', 'You are already logged in.');
        req.session.save((err) => {
            if (err) { console.error(err); }
            res.redirect('/');
        });
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
        req.flash('message', 'Logged out.');
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

// verify email
authRouter.get('/verify/:role/:hashCode', (req, res) => {
    console.log(req.params);

    if (req.isAuthenticated()) {
        req.flash('You must be loggged out before verifying an email address.');
        req.session.save((err) => {
            if (err) { console.error(err) };
            res.redirect('/');
        });
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
        });
        return;
    }

    switch (role.toLowerCase())
    {
    case 'student':
        process.nextTick(() => {
            Student.findOne({ 'account.hashCode': hashCode, 'account.status': 0, 'account.role': 0 }, (err, student) => {

                console.log(`Student: ${student}`);

                if (err) {
                    console.error(`An error occurred while querying for verification hash code of student:\n${err}`);
                    req.flash('message', 'An error occurred. Please try again later.');
                    req.session.save((err) => {
                        if (err) { console.error(err) };
                        res.redirect('/');
                    });
                    return;
                }

                if (!student) {
                    req.flash('message', 'Page not found.');
                    req.session.save((err) => {
                        if (err) { console.error(err); }
                        res.redirect('/');
                    });
                    return;
                }

                student.account.hashCode = null;
                student.account.status = 1;
                student.save((err) => {
                    if (err) {
                        console.error(err);
                        req.flash('message', 'An error occurred. Please try again later.');
                        req.session.save((err) => {
                            if (err) { console.error(err) };
                            res.redirect('/');
                        });
                        return;
                    }

                    req.logIn(student, (err) => {
                        if (err) { 
                            console.error(err);
                            req.flash('message', 'Your student email address has been verified but failed to log you in automatically.');
                            req.session.save((err) => {
                                if (err) { console.error(err); }
                                res.redirect('/auth');
                            });
                        } else {
                            req.flash('message', 'Email address verified.')
                            req.session.save((err) => {
                                if (err) { console.error(err); }
                                res.redirect('/profile');
                            });
                        }
                    });
                });
            });
        });
        break;

    case 'placeowner':
        Placeowner.findOne({ 'account.hashCode': hashCode, 'account.status': 0, 'account.role': 1 }, (err, placeowner) => {
            if (err) {
                console.error(`An error occurred while querying for verification hash code of placeowner:\n${err}`);
                req.flash('message', 'An error occurred. Please try again later.');
                req.session.save((err) => {
                    if (err) { console.error(err) };
                    res.redirect('/');
                });
                return;
            }

            if (!placeowner) {
                req.flash('message', 'Page not found.');
                req.session.save((err) => {
                    if (err) { console.error(err); }
                    res.redirect('/');
                });
                return;
            }

            placeowner.account.hashCode = null;
            placeowner.account.status = 1;
            placeowner.save((err) => {
                if (err) {
                    console.error(err);
                    req.flash('message', 'An error occurred. Please try again later.');
                    req.session.save((err) => {
                        if (err) { console.error(err) };
                        res.redirect('/');
                    });
                    return;
                }

                req.logIn(placeowner, (err) => {
                    if (err) { 
                        console.error(err);
                        req.flash('message', 'Your placeowner email address has been verified but failed to log you in automatically.');
                        req.session.save((err) => {
                            if (err) { console.error(err); }
                            res.redirect('/auth');
                        });
                    } else {
                        req.flash('message', 'Email address verified.')
                        req.session.save((err) => {
                            if (err) { console.error(err); }
                            res.redirect('/profile');
                        });
                    }
                });
            });
        });
        break;

    default:
        
    }
})

// forgot password
authRouter.get('/reset/:role/:hashCode', (req, res) => {

    console.log(req.params);

    if (req.isAuthenticated()) {
        req.flash('You must be loggged out before resetting a forgotten password.');
        req.session.save((err) => {
            if (err) { console.error(err) };
            res.redirect('/');
        });
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
        });
        return;
    }

    switch (role.toLowerCase())
    {
    case 'student':
        process.nextTick(() => {
            Student.findOne({ 'account.hashCode': hashCode, 'account.status': 1, 'account.role': 0 }, (err, student) => {
    
                console.log(`Student: ${student}`);

                if (err) {
                    console.error(`An error occurred while querying for hash code of student:\n${err}`);
                    req.flash('message', 'An error occurred. Please try again later.');
                    req.session.save((err) => {
                        if (err) { console.error(err) };
                        res.redirect('/');
                    });
                    return;
                }
    
                if (!student) {
                    req.flash('message', 'Page not found.');
                    req.session.save((err) => {
                        if (err) { console.error(err); }
                        res.redirect('/');
                    });
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
            });
        });
        break;

    case 'placeowner':
        process.nextTick(() => {
            Placeowner.findOne({ 'account.hashCode': hashCode, 'account.status': 1, 'account.role': 1 }, (err, placeowner) => {
                
                console.log(`Placeowner: ${placeowner}`);

                if (err) {
                    console.error(`An error occurred while querying for hash code of Placeowner [${placeowner.account.email}]:\n${err}`);
                    req.flash('message', 'An error occurred. Please try again later.');
                    req.session.save((err) => {
                        if (err) { console.error(err); }
                        res.redirect('/');
                    });
                    return;
                }
    
                if (!placeowner) {
                    req.flash('message', 'Page not found.');
                    req.session.save((err) => {
                        if (err) { console.error(err); }
                        res.redirect('/');
                    });
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
            });
        });
        break;

    default: 
        req.flash('message', 'Page not found.');
        req.session.save((err) => {
            if (err) { console.error(err); }
            res.redirect('/');
        });
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
                }) ;
            }
        });
    }) (req, res, next);
});


// rsnavigation.com/auth/signup
authRouter.post('/signup', (req, res, next) => {
    passport.authenticate('local-signup', (err, user) => {


        if (err) { 
            console.error(err);
            req.session.save((err) => {
                if (err) { console.error(err); }
                res.redirect('/auth');
            });
            return;
        }

        if (!user) {
            req.session.save((err) => {
                if (err) { console.error(err); }
                return res.redirect('/auth');
            });
        }

        crypto.randomBytes(10, (err, buffer) => {
            if (err) {
                console.error(err);
                    req.flash('message', 'An error occurred. Please try again later.');
                    req.session.save((err) => {
                        if (err) { console.error(err); }
                        res.redirect('/auth');
                    })
                return;
            }
            const hashCode = buffer.toString('hex');
            console.log(`Generated Signup Hash Code: ${hashCode}`);
            user.account.hashCode = hashCode;
            user.save((err) => {
                if (err) {
                    console.error(err);
                    req.flash('message', 'An error occurred. Please try again later.');
                    req.session.save((err) => {
                        if (err) { console.error(err); }
                        res.redirect('/auth');
                    });
                    return;
                }

                sendEmailVerification(req, res, user, hashCode);
            });
        });
    }) (req, res, next);
});

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
        });
        return;
    }

    switch (inputRole.toLowerCase())
    {
    case 'student':
        process.nextTick(() => {

            Student.findOne({ 'account.email': inputEmail, 'account.role': 0 }, (err, student) => {

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

                crypto.randomBytes(10, (err, buffer) => {
                    if (err) {
                        console.error(err);
                        req.flash('message', 'An error occurred. Please try again later.');
                        req.session.save((err) => {
                            if (err) { console.error(err); }
                            res.redirect('/auth');
                        })
                        return;
                    }

                    const hashCode = buffer.toString('hex');
                    console.log(`Generated Student Hash Code: ${hashCode}`);
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

                        sendResetPasswordEmail(req, res, student, hashCode);
                    });
                });
            });
        });
        break;

    case 'placeowner':
        process.nextTick(() => {
            Placeowner.findOne({ 'account.email': inputEmail, 'account.role': 1 }, (err, placeowner) => {

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
                    });
                    return;
                }

                if (placeowner.account.status == 0) {
                    req.flash('message', 'Your email address is still unverified.');
                    req.session.save((err) => {
                        if (err) { console.error(err); }
                        res.redirect('/auth');
                    });
                    return;
                }

                crypto.randomBytes(10, (err, buffer) => {
                    if (err) {
                        console.error(err);
                        req.flash('message', 'An error occurred. Please try again later.');
                        req.session.save((err) => {
                            if (err) { console.error(err); }
                            res.redirect('/auth');
                        })
                        return;
                    }

                    const hashCode = buffer.toString('hex');
                    placeowner.account.hashCode = hashCode;
                    console.log(`Generated Placeowner Hash Code: ${hashCode}`);
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
    
                        sendResetPasswordEmail(req, res, placeowner, hashCode);
                    });
                });
            });
        });
        break;

    default:
        req.flash('message', 'Invalid role provided.');
        req.session.save((err) => {
            if (err) { console.error(err); }
            res.redirect('/auth');
        });
    }
});

// forgot password
authRouter.post('/reset', (req, res) => {

    if (req.isAuthenticated()) {
        req.flash('message', 'You must log out first before resetting forgotten password.');
        req.session.save((err) => {
            if (err) { console.error(err); }
            res.redirect('/');
        });
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
        });
        return;
    }

    switch (role.toLowerCase())
    {
    case 'student':
        Student.findOne({ 'account.email': email, 'account.hashcode': hashCode, 'account.status': 1 }, (err, student) => {
            if (err) {
                console.error(`An error occurred while querying for hash code of student email [${email}]:\n${err}`);
                req.flash('message', 'An error occurred. Please try again later.');
                req.session.save((err) => {
                    if (err) { console.error(err); }
                    res.redirect('/auth');
                });
                return;
            }

            if (!student) {
                req.flash('message', 'Invalid credentials.');
                req.session.save((err) => {
                    if (err) { console.error(err); }
                    res.redirect('/auth');
                });
                return;
            }

            student.account.password = newPassword;
            student.account.haschCode = null;
            student.save((err) => {
                if (err) {
                    console.error(`An error occurred while saving Student ${student.account.email}'s new password.`);
                    req.flash('message', 'Failed to update your password. Please try again later.');
                    req.session.save((err) => {
                        if (err) { console.error(err); }
                        res.redirect('/auth');
                    });
                    return;
                }

                req.flash('message', 'Password updated.');
                req.session.save((err) => {
                    if (err) { console.error(err); }
                    res.redirect('/auth');
                });
            });
        });
        break;

    case 'placeowner':
        Placeowner.findOne({ 'account.email': email, 'account.hashcode': hashCode, 'account.status': 1 }, (err, placeowner) => {
            if (err) {
                console.error(`An error occurred while querying for hash code of placeowner email [${email}]:\n${err}`);
                req.flash('message', 'An error occurred. Please try again later.');
                req.session.save((err) => {
                    if (err) { console.error(err); }
                    res.redirect('/auth');
                });
                return;
            }

            if (!placeowner) {
                req.flash('message', 'Invalid credentials.');
                req.session.save((err) => {
                    if (err) { console.error(err); }
                    res.redirect('/auth');
                });
                return;
            }

            placeowner.account.password = newPassword;
            placeowner.account.hashCode = null;
            placeowner.save((err) => {
                if (err) {
                    console.error(`An error occurred while saving Placeowner ${placeowner.account.email}'s new password.`);
                    req.flash('message', 'Failed to update your password. Please try again later.');
                    req.session.save((err) => {
                        if (err) { console.error(err); }
                        res.redirect('/auth');
                    });
                    return;
                } else {
                    req.flash('message', 'Password updated.');
                    req.session.save((err) => {
                        if (err) { console.error(err); }
                        res.redirect('/auth');
                    });
                    return;
                }
            });
        });
        break;

    default: res.sendStatus(404);
    }
})

authRouter.get('/*', (req, res) => {
    req.flash('message', 'Page not found.');
    req.session.save((err) => {
        if (err) { console.error(err); }
        res.redirect('/');
    });
})

module.exports = authRouter;