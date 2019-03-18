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
        return res.redirect('/');
    }

    res.render('auth', { user: req.user, message: req.flash('message') }, (err, html) => {
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
        req.logout();
    }
    
    return res.redirect('/');
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

function sendResetCodeEmail(recepientEmail, hashCode) {

    const mailOptions = {
        from: "roomstayin.navigation@gmail.com",
        to: recepientEmail,
        subject: "RS Navigation - Reset Password",
        text: `Click this link to reset your password:\nhttp://www.:8080/auth/reset/${hashCode}`
    };
    
    mailer.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error(`An error occurred while sending password reset email to ${recepientEmail}:\n${err}`);
            return false;
        } else {
            console.log(`Email sent: ${info.response}`);
            return true;
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
        req.flash({ 'message': err.message });
        return res.redirect('/auth');
    }

    Student.findOne({ 'account.email': inputEmail }, (err, student) => {

        if (err) {
            console.error(`An error occurred while querying student email [${inputEmail}]`);
            req.flash({ 'message': 'An error occurred. Please try again later.'});
            return res.redirect('/auth');
        }

        if (student) {
            const hashCode = generateHashCode(student.account.email);
            console.log(`Generated Hash Code: ${hashCode}`);

            student.account.hashCode = hashCode;
            
            student.save((err) => {
                if (err) {
                    console.error(`An error occurred while saving student ${inputEmail}:\n${err}`);
                    req.flash({ 'message': 'An error occurred. Please try again later.'});
                    return res.redirect('/auth');
                }

                if (sendResetCodeEmail(student.account.email)) {
                    req.flash({ 'message': 'Successfully sent password reset link to your email.' });
                } else {
                    req.flash({ 'message': 'Failed to send password reset link to your email. Please try again later.' });
                    student.account.hashCode = hashCode;
                    student.save();
                }

                res.redirect('/');
            })

        } else {
            Placeowner.findOne({ 'account.email': inputEmail }, (err, placeowner) => {
                if (err) {
                    console.error(`An error occurred while querying placeowner email [${inputEmail}]`);
                    req.flash({ 'message': 'An error occurred. Please try again later.'});
                    return res.redirect('/auth');
                }

                if (!placeowner) {
                    req.flash({ 'message': 'Placeowner email does not exist.'});
                    return res.redirect('/auth');
                }


                const hashCode = generateHashCode(student.account.email);
                console.log(`Generated Hash Code: ${hashCode}`);

                placeowner.account.hashCode = hashCode;

                placeowner.save((err) => {
                    if (err) {
                        console.error(`An error occurred while saving placeowner ${inputEmail}:\n${err}`);
                        req.flash({ 'message': 'An error occurred. Please try again later.'});
                        return res.redirect('/auth');
                    }
    
                    if (sendResetCodeEmail(student.account.email)) {
                        req.flash({ 'message': 'Successfully sent password reset link to your email.' });
                    } else {
                        req.flash({ 'message': 'Failed to send password reset link to your email. Please try again later.' });
                        placeowner.account.hashCode = hashCode;
                        placeowner.save();
                    }
    
                    res.redirect('/');
                })
            })
        }
        
    })
})

// forgot password
authRouter.get('/reset', (req, res) => {
    res.sendStatus(404);
})

authRouter.get('/*', (req, res) => {
    res.sendStatus(404);
})

module.exports = authRouter;