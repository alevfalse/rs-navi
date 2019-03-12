const openRouter = require('express').Router();
const request = require('request-promise');
// const argon2 = require('argon2');

const mongoose = require('mongoose');
const Query = require('../models/query');

openRouter.get('/', (req, res) => {
    res.render('index');
})

openRouter.get('/add', (req, res) => {
    res.redirect('/auth/login/placeowner');
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