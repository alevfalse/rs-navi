const authRouter = require('express').Router();
const mailer = require('../../config/mailer');

const passport = require('../../config/passport');
const mongoose = require('mongoose');
const Account = require('../models/account');

// forgot password
authRouter.get('/forgot', (req, res) => {
    res.render('forgot');
})

authRouter.post('/forgot', (req, res) => {
    const inputEmail = req.body.inputEmail;
    console.log(`Email: ${inputEmail}`);

    Account.findOne({ 'email': inputEmail }, (err, acc) => {
        if (err) {
            console.error(err);
            return res.redirect('/auth/forgot');
        }

        if (!acc) {
            return res.send('Email does not exist.');
        }

        const unhashedString = inputEmail + 'SALT'  + new Date().toUTCString();
        console.log(unhashedString);
        
        const hashCode = Math.abs(getHashCode(unhashedString));
        console.log(hashCode);

        acc.hashCode = hashCode;

        acc.save((err) => {
            if (err) {
                console.error(err);
                return res.redirect('/auth/forgot');
            }

            Account.find({}, (err, results) => {
                results.forEach(res => {
                    console.log(res);
                })
            })

            const mailOptions = {
                from: "roomstayin.navigation@gmail.com",
                to: inputEmail,
                subject: "Reset Password",
                text: `Click this link to reset your password:\nlocalhost:8080/auth/reset/${hashCode}`
            };
            
            mailer.sendMail(mailOptions, (err, info) => {
                if (err) console.error(err);
                else console.log(`Email sent: ${info.response}`);
                res.send('Password reset link has been sent to your email.');
            });
        })
        
    })
})

// forgot password
authRouter.get('/reset/:code', (req, res) => {
    console.log(`Reset Code: ${req.params.code}`)

    Account.findOne({ 'hashCode': req.params.code }, (err, acc) => {
        if (err || !acc) {
            console.error(err);
            res.status(404);
            return res.send('<h2>404 Page Not Found</h2>');
        }

        console.log(acc);
        acc.hashCode = null;
        acc.save((err) => {
            if (err) console.error(err);
            res.send('<h4>Enter new password: </h4>');
        })
    })
})

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

module.exports = authRouter;