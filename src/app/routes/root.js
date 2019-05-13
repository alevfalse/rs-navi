const rootRouter = require('express').Router();
const Place = require('../models/place');
const logger = require('../../config/logger');

rootRouter.get('/', (req, res, next) => {
    res.render('index', { user: req.user, message: req.flash('message') },
    (err, html) => err ? next(err) : res.send(html));
});

rootRouter.get('/search', (req, res, next) => {
    console.log(req.query);

    let city = req.query.city;

    if (city === 'Kalakhang Maynila') city = 'Metro Manila';

    Place.find({ 'address.city': city, 'status': 1 })
    .populate('images owner')
    .exec((err, places) => {
        if (err) { logger.error(err); return res.send(null); }
        res.send(places);
    });
});

module.exports = rootRouter;
