const authRouter = require('express').Router();
const mailer = require('../../config/mailer');
const passport = require('../../config/passport');

// Models
const Student = require('../models/student');
const Placeowner = require('../models/placeowner');

function getHashCode(str) {
    let hash = 0, i, chr;

    if (str.length === 0) return hash;

    for (i = 0; i < str.length; i++) {
        chr   = str.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

// ========================================================================================
// GET ROUTES ============================================================================

// rsnavigation.com/auth/
authRouter.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        req.flash('message', 'You are already logged in.');
        return res.redirect('/');
    }

    const flashMessage = req.flash('message');
    console.log(`Flash Message: ${flashMessage}`);

    res.render('auth', { user: req.user, message: flashMessage }, (err, html) => {
        if (err) {
            console.error(`An error occurred while rendering Authentication page:\n${err}`);
            return res.sendStatus(500);
            // return res.sendFile('/public/status/500.html', { root: __dirname });
        }
        res.status(200).send(html);
    });
})

authRouter.get('/logout', (req, res) => {
    if (req.isAuthenticated()) {
        console.log(`${req.user.firstName} logged out.`);
        req.logout();
        req.flash('message', 'Successfully logged out.');
        return res.redirect('/');
    } else {
        console.log('Already logged out.');
        req.flash('message', 'You are already logged out.');
        return res.redirect('/');
    }
})

// ========================================================================================
// POST ROUTES ============================================================================

// rsnavigation.com/auth/login
authRouter.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/auth',
    failureFlash: true,
}))

// rsnavigation.com/auth/signup
authRouter.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/auth',
    failureRedirect: '/auth',
    failureFlash: true,
    successFlash: true,
    session: false
}))


function generateHashCode(email) {
    const unhashedString = email + 'SALT'  + new Date().toUTCString();
    return Math.abs(getHashCode(unhashedString));
}

function sendResetCodeEmail(recepientEmail, hashCode, user, role, req, res) {

    const text = `Good day! We have received a password reset request from your account.\n\n`
        + `You can click this link to reset your password:\nhttp://rsnavigation.com/auth/reset/${role}/${hashCode}`;

    const mailOptions = {
        from: "roomstayin.navigation@gmail.com",
        to: recepientEmail,
        subject: "RS Navigation - Reset Password",
        text: text
    };
    
    mailer.sendMail(mailOptions, function (err, info) {

        if (err) {
            req.flash('message', 'Failed to send password reset link to your email. Please try again later.');
            console.error(`An error occurred while sending password reset email to ${recepientEmail}:\n${err}`);
            user.account.hashCode = null;
            user.save((err) => {
                if (err) {
                    console.error(`An error occurred while deleting hashCode of ${user.account.email}:\n${err}`);
                }
                return res.redirect('/auth');
            });
        } else {
            req.flash('message', 'Successfully sent password reset link to your email.');
            console.log(`Email sent: ${info.response}`);
            return res.redirect('/auth');
        }
    });
}

// rsnavigation.com/auth/forgot
authRouter.post('/forgot', (req, res) => {
    const inputEmail = req.body.email;
    console.log(`Email: ${inputEmail}`);

    if (!inputEmail) {
        const err = new Error(`No email provided.`);
        console.error(err.message);
        req.flash( 'message', err.message );
        return res.redirect('/auth');
    }

    Student.findOne({ 'account.email': inputEmail }, (err, student) => {

        if (err) {
            console.error(`An error occurred while querying student email [${inputEmail}]`);
            req.flash( 'message', 'An error occurred. Please try again later.');
            return res.redirect('/auth');
        }

        if (student) {

            const hashCode = generateHashCode(student.account.email);
            console.log(`Generated Hash Code: ${hashCode}`);

            student.account.hashCode = hashCode;
            
            student.save((err) => {
                if (err) {
                    console.error(`An error occurred while saving student ${inputEmail}:\n${err}`);
                    req.flash('message', 'An error occurred. Please try again later.');
                    return res.redirect('/auth');
                }

                sendResetCodeEmail(student.account.email, hashCode, student, 'student', req, res);
            })

        } else {

            Placeowner.findOne({ 'account.email': inputEmail }, (err, placeowner) => {

                if (err) {
                    console.error(`An error occurred while querying placeowner email [${inputEmail}]`);
                    req.flash('message', 'An error occurred. Please try again later.');
                    return res.redirect('/auth');
                }

                if (!placeowner) {
                    req.flash('message', 'Placeowner email does not exist.');
                    return res.redirect('/auth');
                }


                const hashCode = generateHashCode(placeowner.account.email);
                console.log(`Generated Hash Code: ${hashCode}`);

                placeowner.account.hashCode = hashCode;

                placeowner.save((err) => {
                    if (err) {
                        console.error(`An error occurred while saving placeowner ${inputEmail}:\n${err}`);
                        req.flash('message', 'An error occurred. Please try again later.');
                        return res.redirect('/auth');
                    }

                    sendResetCodeEmail(placeowner.account.email, hashCode, placeowner, 'placeowner', req, res);
                })
            })
        }
        
    })
})

// forgot password
authRouter.get('/reset/:role/:hashCode', (req, res) => {

    if (req.isAuthenticated()) {
        req.flash('You must log out first before resetting forgotten password.');
        return res.redirect('/');
    }

    const role = req.params.role;
    const hashCode = req.params.hashCode;

    if (!role || !hashCode) {
        console.error('Missing required queries.');
        return res.redirect('/auth');
    }

    switch (role)
    {
    case 'student':
        Student.findOne({ 'account.hashCode': hashCode }, (err, student) => {
            console.log(student);

            if (err) {
                console.error(`An error occurred while querying for hash code of student:\n${err}`);
                req.flash('message', 'An error occurred. Please try again later.');
                return res.redirect('/auth');
            }

            if (!student) {
                return res.sendStatus(404);
            }

            res.render('reset', { message: req.flash('message'), email: student.account.email, role: role, hashCode: hashCode });
        })
        break;

    case 'placeowner':
        Placeowner.findOne({ 'account.hashCode': hashCode }, (err, placeowner) => {
            if (err) {
                console.error(`An error occurred while querying for hash code of Placeowner [${placeowner.account.email}]:\n${err}`);
                req.flash('message', 'An error occurred. Please try again later.');
                return res.redirect('/auth');
            }

            if (!placeowner) {
                return res.sendStatus(404);
            }

            console.log(placeowner);
            res.render('reset', { message: req.flash('message'), email: placeowner.account.email, role: role, hashCode: hashCode });
        })
        break;

    default: res.sendStatus(404);
    }
})

// forgot password
authRouter.post('/reset', (req, res) => {

    if (req.isAuthenticated()) {
        req.flash('message', 'You must log out first before resetting forgotten password.');
        return res.redirect('/');
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
        return res.redirect('/auth');
    }

    switch (role)
    {
    case 'student':
        Student.findOne({ 'account.email': email, 'account.hashcode': hashCode }, (err, student) => {
            if (err) {
                console.error(`An error occurred while querying for hash code of student email [${email}]:\n${err}`);
                req.flash('message', 'An error occurred. Please try again later.');
                return res.redirect('/auth');
            }

            if (!student) {
                console.error(`Invalid POST request for placeowner password reset.`);
                return res.sendStatus(404);
            }

            student.account.password = newPassword;
            student.account.haschCode = null;
            student.save((err) => {
                if (err) {
                    console.error(`An error occurred while saving Student ${student.account.email}'s new password.`);
                    req.flash('message', 'An error occurred. Failed to update you password.');
                    return res.redirect('/auth');
                } else {
                    req.flash('message', 'Password update successful.');
                    return res.redirect('/auth');
                }
            })
        })
        break;

    case 'placeowner':
        Placeowner.findOne({ 'account.email': email, 'account.hashcode': hashCode }, (err, placeowner) => {
            if (err) {
                console.error(`An error occurred while querying for hash code of placeowner email [${email}]:\n${err}`);
                req.flash('message', 'An error occurred. Please try again later.');
                return res.redirect('/auth');
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
                    return res.redirect('/auth');
                } else {
                    req.flash('message', 'Password update successful.');
                    return res.redirect('/auth');
                }
            })
        })
        break;

    default: res.sendStatus(404);
    }
})

authRouter.get('/*', (req, res) => {
    res.sendStatus(404);
})

module.exports = authRouter;