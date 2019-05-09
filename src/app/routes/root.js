const rootRouter = require('express').Router();
const Place = require('../models/place');

rootRouter.get('/', (req, res, next) => {
    res.render('index', { user: req.user, message: req.flash('message') },
    (err, html) => err ? next(err) : res.send(html));
});

rootRouter.get('/search', (req, res, next) => {
    // TODO: Only send nearby places (same city?)
    Place.find({ 'status': 1 }, (err, places) => err ? res.send(null) : res.send(places));
});

module.exports = rootRouter;
