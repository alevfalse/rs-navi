const authRouter = require('express').Router();

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

module.exports = authRouter;