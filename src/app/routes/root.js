const rootRouter = require('express').Router();
const Place = require('../models/place');
const logger = require('../../config/logger');
const sanitize = require('../../bin/sanitizer');

rootRouter.get('/', (req, res, next) => {
    res.render('index', { user: req.user, message: req.flash('message') },
    (err, html) => err ? next(err) : res.send(html));
});

rootRouter.get('/search', (req, res, next) => {
    
    Place.find({ 'address.city': sanitize(req.query.city), 'status': 1 })
    .populate('reviews images')
    .exec((err, results) => {
        
        if (err) { 
            logger.error(err); 
            return res.send(null); 
        }

        let response = [];

        for (let place of results) {
            response.push({
                place: place,
                score: place.stars
            });
        }

        res.send(response);
    });
});

module.exports = rootRouter;
