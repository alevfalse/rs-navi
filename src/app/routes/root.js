const openRouter = require('express').Router();
const request = require('request-promise');
// const argon2 = require('argon2');

const mongoose = require('mongoose');
const Query = require('../models/query');

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        console.log(`Unauthorized access for ${req.url}`)
        res.redirect('/');
    }
}

openRouter.get('/', (req, res) => {
    console.log(`Authenticated: ${req.isAuthenticated()}`);

    const flashMessage = req.flash('message');
    console.log(`Flash Message: ${flashMessage}`);

    res.render('index', { user: req.user, message: flashMessage }, (err, html) => {
        if (err) {
            console.error(`Something went wrong while rendering the [index] page:\n${err}`);
            res.sendStatus(500);
        }
        res.status(200).send(html);
    });
})

openRouter.get('/profile', isAuthenticated, (req, res) => {
    res.render('profile', { user: req.user, message: req.flash('message') }, (err, html) => {
        if (err) {
            console.error(`Something went wrong while rendering the [profile] page:\n${err}`);
            res.sendStatus(500);
        }
        res.status(200).send(html); 
    });
})

openRouter.get('/search', (req, res) => {
    const query = req.query.schoolName;

    if (!query) {
        req.flash('message', 'Please provide a school name.');
        res.redirect('/');
    }
    console.log(`Search Query: ${query}`);

    const newQuery = new Query({ keyword: query });
    newQuery.save((err, savedQuery) => {
        if (err) {
            console.error(`An error occurred while saving query [${query}] to database:\n${err}`);
        } else {
            console.log(`Search query "${savedQuery.keyword}" has been saved to the database.`);
        }
    })

    if (process.env.MAPBOX_ACCESS_TOKEN) {
        const uri = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json`
        + `?access_token=${process.env.MAPBOX_ACCESS_TOKEN}&autocomplete=true&country=ph`;

        console.log(uri);

        request(uri).then(response => {
            const data = JSON.parse(response);
            //console.log(data.features);
            res.send(data.features);
        }).catch(err => console.error(err));

    } else {
        console.error('No MAPBOX ACCESS TOKEN in your .env file.');
        req.flash('message', 'Search is temporarily unavailable at the moment. Please try again later.');
        res.status(503).redirect('/');
    }
})

openRouter.get('/*', (req, res) => {
    res.sendStatus(404);
})

module.exports = openRouter;