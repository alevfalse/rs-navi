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
    .populate('reviews images')
    .exec((err, results) => {
        if (err) { logger.error(err); return res.send(null); }

        let response = [];

        for (let place of results) {
            response.push({
                place: place,
                score: place.stars
            });
        }

        console.log(response);
        res.send(response);
    });
});

module.exports = rootRouter;
