const openRouter = require('express').Router();
const request = require('request-promise');
// const argon2 = require('argon2');

// a middleware to check if a user is logged in
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        if (req.user.account.role === 7) {
            res.redirect('/admin');
        } else {
            next();
        }
    } else {
        res.redirect('/auth');
    }
}

openRouter.get('/', (req, res, next) => {
    res.render('index', { user: req.user, message: req.flash('message') },
    (err, html) => {
        if (err) { return next(err); }
        res.send(html);
    });
});

openRouter.get('/search', (req, res, next) => {

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

    const uri = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json`
    + `?access_token=${process.env.MAPBOX_ACCESS_TOKEN}&autocomplete=true&country=ph`;

    request(uri).then(response => {
        const data = JSON.parse(response);
        res.json(data.features); // TODO: update to user friendly format
    })
    .catch(err => { 
        if (err) { return next(err); }
        res.redirect('/');
    });
})

openRouter.get('/profile', isAuthenticated, (req, res, next) => {
    res.render('profile2', { user: req.user, message: req.flash('message') },
    (err, html) => {
        if (err) { return next(err); }
        res.send(html);
    });
});

module.exports = openRouter;