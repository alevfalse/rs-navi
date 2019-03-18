const adminRouter = require('express').Router();
const passport = require('../../config/passport');

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated() && req.user.account.role == 7) {
        console.log('User:');
        console.log(req.user);
        return next();
    } else {
        console.log(`Unauthorized access for: ${req.url}`);
        return res.status(401).redirect('/admin/login');
    }
}

// rsnavigation.com/admin
adminRouter.get('/', isAuthenticated, (req, res) => {
    res.render('admin/home', { message: req.flash('message') }, (err, html) => {
        if (err) {
            console.error(`Something went wrong while rendering the [Admin Home] page:\n${err}`);
            res.sendStatus(500);
        }
        res.status(200).send(html);
    });
});

// rsnavigation.com/admin/login
adminRouter.get('/login', (req, res) => {
    res.render('admin/login', { message: req.flash('message') }, (err, html) => {
        if (err) {
            console.error(`Something went wrong while rendering the [Admin Login] page:\n${err}`);
            res.sendStatus(500);
        }
        res.status(200).send(html);
    });
});

adminRouter.get('/*', (req, res) => {
    res.sendStatus(404);
});

// rsnavigation.com/admin/login
adminRouter.post('/login', passport.authenticate('local-login-admin', {
    successRedirect: '/admin',
    failureRedirect: '/admin/login',
    failureMessage: true
}));

module.exports = adminRouter;
