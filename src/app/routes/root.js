const rootRouter = require('express').Router();
const Place = require('../models/place');

rootRouter.get('/', (req, res, next) => {
    res.render('index', { user: req.user, message: req.flash('message') },
    (err, html) => err ? next(err) : res.send(html));
});

rootRouter.get('/search', (req, res, next) => {

    const query = req.query.schoolName;

    if (!query) {
        req.flash('message', 'Please provide a school name.');
        return req.session.save((err) => { 
            if (err) { return next(err); }
            res.redirect('/');
        });

    } else if (query.length <= 1) {
        req.flash('message', 'School name is too short.');
        return req.session.save((err) => { 
            if (err) { return next(err); }
            res.redirect('/');
        });
    }

    // TODO: Only send nearby places (same city?)
    Place.find((err, places) => err ? res.send(null) : res.send(places));
});

module.exports = rootRouter;
