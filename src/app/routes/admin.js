const adminRouter = require('express').Router();

function isAuthenticated(req, res, next) {
    console.log('User:');
    console.log(req.user);
    if (req.isAuthenticated()) {
        return next();
    } else {
        return res.redirect('/admin/login')
    }
}

adminRouter.get('/', isAuthenticated, (req, res) => {
    res.render('admin/home');
})

adminRouter.get('/login', (req, res) => {
    res.render('admin/login');
})

module.exports = adminRouter;
