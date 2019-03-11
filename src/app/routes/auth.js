const authRouter = require('express').Router();
const mailer = require('../../config/mailer');
// student login
authRouter.get('/login/student', (req, res) => {
    res.render('login');
})

authRouter.post('/login/student', (req, res) => {
    res.render('/');
})

// student signup
authRouter.get('/signup/student', (req, res) => {
    res.render('signup');
})

authRouter.post('/signup/student', (req, res) => {
    res.redirect('');
})

// place owner login
authRouter.get('/login/placeowner', (req, res) => {
    res.render('loginPO');
})

authRouter.post('/login/placeowner', (req, res) => {
    res.render('/');
})

// place owner signup
authRouter.get('/signup/placeowner', (req, res) => {
    res.render('signupPO');
})

authRouter.post('/signup/placeowner', (req, res) => {
    res.render('signupPO');
})

// forgot password
authRouter.get('/forgot', (req, res) => {
    res.render('forgot');
})

authRouter.post('/forgot', (req, res) => {
    const inputEmail = req.body.inputEmail;
    console.log(`Email: ${inputEmail}`);

    const unhashedString = inputEmail + 'SALT'  + new Date().toUTCString();
    console.log(unhashedString);
    
    const hashCode = Math.abs(getHashCode(unhashedString));
    console.log(hashCode);

    const mailOptions = {
        from: "roomstayin.navigation@gmail.com",
        to: inputEmail,
        subject: "Reset Password",
        text: `Click this link to reset your password:\nlocalhost:8080/auth/reset/${hashCode}`
    };
    
    mailer.sendMail(mailOptions, (err, info) => {
        if (err) console.error(err);
        else console.log(`Email sent: ${info.response}`);
        res.redirect('/');
    });
})

// forgot password
authRouter.get('/reset/:code', (req, res) => {
    console.log(`Reset Code: ${req.params.code}`)
    res.redirect('/');
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