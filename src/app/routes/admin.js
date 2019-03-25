const adminRouter = require('express').Router();
const passport = require('../../config/passport');

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated() && req.user.account.role == 7) {
        return next();
    }
        
    console.log(`Unauthorized access for Admin URL: ${req.url}`);
    req.flash('message', 'Unauthorized!');
    return res.redirect('/admin/login');
}

// GET rsnavigation.com/admin
adminRouter.get('/', isAuthenticated, (req, res) => {
    
    req.session.save((err) => {
        if (err) {
            console.error(err);
            return res.sendStatus(500); // TODO: Send custom status 500 page
        }

        res.render('admin/home', { message: req.flash('message') },
        (err, html) => {
            if (err) {
                console.error(err);
                return res.sendStatus(500); // TODO: Send custom status 500 page
            }
            return res.send(html);
        });
    });
});

// GET rsnavigation.com/admin/login
adminRouter.get('/login', (req, res) => {

    req.session.save((err) => {
        if (err) {
            console.error(err);
            return res.sendStatus(500); // TODO: Send custom status 500 page
        }

        res.render('admin/login', { message: req.flash('message') },
        (err, html) => {
            if (err) {
                console.error(err);
                return res.sendStatus(500); // TODO: Send custom status 500 page
            }
            return res.send(html);
        });
    });
});

// Invalid URL
adminRouter.get('/*', (req, res) => {
    console.log('ADMIN: Page Not Found');
    req.flash('message', 'Page not found.');
    return res.redirect('/admin');
});

// rsnavigation.com/admin/login
adminRouter.post('/login', passport.authenticate('local-login-admin', {
    successRedirect: '/admin',
    failureRedirect: '/admin/login',
    failureMessage: true
}));

module.exports = adminRouter;
