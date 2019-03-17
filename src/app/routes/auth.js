const authRouter = require('express').Router();
const mailer = require('../../config/mailer');
const passport = require('../../config/passport');

// rsnavigation.com/auth/
authRouter.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/profile');
    } else {
        res.render('auth'); // login/signup/forgot password forms
    }
})

// rsnavigation.com/auth/login
authRouter.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/auth',
    failureFlash: true
}))

// rsnavigation.com/auth/signup
authRouter.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/auth',
    failureFlash: true
}))

// rsnavigation.com/auth/forgot
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
authRouter.get('/reset', (req, res) => {
    res.status(404).render('404');
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

authRouter.get('/*', (req, res) => {
    res.status(404).render('404');
})

module.exports = authRouter;