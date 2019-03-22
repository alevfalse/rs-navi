const openRouter = require('express').Router();
const request = require('request-promise');
// const argon2 = require('argon2');

const Query = require('../models/query');

// a middle to check if a user is logged in
function isAuthenticated(req, res, next) {
    console.log(`${req.url}: Authenticated: ${req.isAuthenticated()}`);
    if (req.isAuthenticated()) {
        return next();
    } else {
        req.flash('message', 'Unauthorized!');
        req.session.save((err) => {
            if (err) console.error(err);
            res.redirect('/auth');
        })
    }
}

openRouter.get('/', (req, res) => {
    res.render('index', { user: req.user, message: req.flash('message') },
        (err, html) => {
            if (err) { 
                console.error(err);
                return res.sendStatus(500); 
            }
            res.send(html);
        }
    );
})

openRouter.get('/search', (req, res) => {
    const query = req.query.schoolName;

    if (!query) {
        req.flash('message', 'Please provide a school name.');
        req.session.save((err) => {
            if (err) console.error(err);
            res.redirect('/');
        });
        return;
    } else if (query.length <= 1) {
        req.flash('message', 'School name is too short.');
        req.session.save((err) => {
            if (err) console.error(err);
            res.redirect('/');
        });
        return;
    }

    const newQuery = new Query({ keyword: query });
    newQuery.save((err, savedQuery) => {
        if (err) console.error(`An error occurred while saving query [${query}] to database:\n${err}`);
        else console.log(`Search query "${savedQuery.keyword}" has been saved to the database.`);
    })

    const uri = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json`
    + `?access_token=${process.env.MAPBOX_ACCESS_TOKEN}&autocomplete=true&country=ph`;

    request(uri).then(response => {
        const data = JSON.parse(response);
        res.send(data.features); // update for user friendly format
    }).catch(err => console.error(err));
})

openRouter.get('/profile', isAuthenticated, (req, res) => {
    res.render('profile', { user: req.user },
        (err, html) => {
            if (err) { 
                console.error(err);
                return res.sendStatus(500); 
            }
            res.send(html);
        }
    );
})

openRouter.get('/*', (req, res) => {
    req.flash('message', 'Page not found.');
    req.session.save((err) => {
        if (err) console.error(err);
        res.redirect('/');
    })
})

module.exports = openRouter;