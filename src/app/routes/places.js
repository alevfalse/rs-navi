const placesRouter = require('express').Router();
const upload = require('../../config/upload');

const Place = require('../models/place');

function isAuthorized(req, res, next) {
    if (req.isAuthenticated() && req.user.account.role == 1) {
        console.log('Authenticated! ' + req.url);
        return next();
    } else {
        return res.redirect('/auth?placeowner=1');
    }
}

// GET rsnavigation.com/places/add
placesRouter.get('/add', isAuthorized, (req, res, next) => {
    return res.render('add-place', { user: req.user, message: req.flash('message') }, 
    (err, html) => {
        if (err) { return next (err); }
        res.send(html);
    });
});

// POST rsnavigation.com/places/add
placesRouter.post('/add', isAuthorized, upload.single('file'), (req, res, next) => {

    console.log(req.body);

    const ownerId = req.user.id;

    const name        = req.body.name;
    const placeType   = req.body.placeType;

    const number      = req.body.number;
    const street      = req.body.street;
    const subdivision = req.body.subdivision;
    const barangay    = req.body.barangay;
    const city        = req.body.city;
    const zipCode     = req.body.zipCode;
    const province    = req.body.province;

    const price       = req.body.price;
    const listType    = req.body.listType;

    const description = req.body.description;
    const coordinates = req.body.coordinates.split(',');

    if (!ownerId || !name || !placeType || !number || !street || !barangay 
        || !city || !province || !price || !listType || !description || !coordinates)
    {
        req.flash('message', 'Missing required input field(s).');
        return req.session.save((err) => {
            if (err) { return next(err); }
            res.redirect('/places/add');
        });
    }

    const newPlace = new Place({
        owner: ownerId,

        name: name,
        placeType: placeType,

        address: {
            number: number,
            street: street,
            subdivision: subdivision,
            barangay: barangay,
            city: city,
            zipCode: zipCode,
            province: province
        },

        price: price,
        listType: listType,
        
        description: description,
        coordinates: coordinates
    });

    newPlace.save((err) => {
        if (err) { return next(err); }

        req.flash('message', `${newPlace.name} has been listed.`);
        req.session.save((err) => {
            if (err) { return next(err); }
            res.redirect('/places/add');
        });
    }); 
});

module.exports = placesRouter;
