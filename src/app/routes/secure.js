const secureRouter = require('express').Router();

secureRouter.use((req, res, next) => {
    if (req.isAuthenticated()) {
        console.log('Authenticated!');
        console.log(req.user);
        return next();
    } else {
        res.redirect('/');
    }
})

secureRouter.get('/add', (req, res) => {
    res.send('<h2>Add A Place</h2>');
})