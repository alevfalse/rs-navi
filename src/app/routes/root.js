const rootRouter = require('express').Router();
const Place = require('../models/place');

const fs = require('fs');
const path = require('path');

const logsDirectory = path.join(__dirname, '../../logs/');

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

rootRouter.get('/logs', (req, res, next) => {
    if (fs.existsSync(logsDirectory + 'access.log')) {
        res.sendFile('access.log', { root: logsDirectory});
    } else {
        return next();
    }
})

module.exports = rootRouter;
