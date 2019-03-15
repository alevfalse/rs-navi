const openRouter = require('express').Router();
const request = require('request-promise');
// const argon2 = require('argon2');

const passport = require('../../config/passport');
const mongoose = require('mongoose');
const Query = require('../models/query');
const Account = require('../models/account');

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) next();
    else {
        console.log(`Unauthorized access for ${req.url}`)
        res.redirect('/');
    }
}

function isPostAuthenticated(req, res, next) {
    if (req.isAuthenticated) res.redirect('/profile')
    else next();
}

openRouter.get('/validate/email', (req, res) => {

    const email = req.query.email;

    Account.findOne({ 'email': email }, function(err, account) {
        if (err) throw err;

        if (account) {
            return res.send(false);
        } else {
            res.send(true);
        }
    })
})

openRouter.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('index', { user: req.user });
    } else {
        res.render('index');
    }
})

openRouter.get('/auth', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/profile');
    } else {
        res.render('auth');
    }
})

openRouter.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/auth',
    failureFlash: true
}))

openRouter.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/auth',
    failureFlash: true
}))

openRouter.get('/profile', isAuthenticated, (req, res) => {
    res.render('profile', { user: req.user });
})

openRouter.get('/search', (req, res) => {
    const query = req.query.schoolName;
    console.log(`Search Query: ${query}`);

    const newQuery = new Query({
        _id: new mongoose.Types.ObjectId(),
        keyword: query,
        date: new Date()
    });

    newQuery.save((err, savedQuery) => {
        console.log(`Search query "${savedQuery.keyword}" has been saved to the database.`)
        Query.find({}, (err, result) => {
            result.forEach((res) => {
                console.log(res);
            })
        })
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
        res.redirect('/');
    }
})

module.exports = openRouter;