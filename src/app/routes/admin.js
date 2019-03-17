const adminRouter = require('express').Router();

function isAuthenticated(req, res, next) {
    console.log('User:');
    console.log(req.user);

    if (req.isAuthenticated() && req.user.account.role == 2) {
        return next();
    } else {
        return res.redirect('/admin/login')
    }
}

// rsnavigation.com/admin
adminRouter.get('/', isAuthenticated, (req, res) => {
    res.render('admin/home');
})

// rsnavigation.com/admin/login
adminRouter.get('/login', (req, res) => {
    res.render('admin/login');
})

adminRouter.get('/*', (req, res) => {
    res.status(404).render('404');
})

module.exports = adminRouter;
