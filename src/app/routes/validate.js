const validateRouter = require('express').Router();

validateRouter.get('/email', (req, res, next) => {
    const email = req.query.email;
    res.send(true);
})

validateRouter.get('/*', (req, res) => {
    res.status(404).render('404');
})

module.exports = validateRouter;