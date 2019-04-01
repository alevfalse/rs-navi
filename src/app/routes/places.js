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
    return res.render('add-place', { user: req.user }, 
    (err, html) => {
        if (err) { return next (err); }
        res.send(html);
    });
});

// POST rsnavigation.com/places/add
placesRouter.post('/add', isAuthorized, upload.single('file'), (req, res, next) => {

    console.log(req.body);

    const ownerId = req.user.id;

    const placeName   = req.body.placeName;
    const lotNumber   = req.body.lotNumber;
    const streetName  = req.body.streetName;
    const subdivision = req.body.subdivision;
    const barangay    = req.body.barangay;
    const city        = req.body.city;
    const province    = req.body.province;
    const zipCode     = req.body.zipCode;

    const type        = req.body.type;
    const description = req.body.description;

    if (!ownerId || !placeName || !streetName || !subdivision || !barangay 
        || !city || !province || !zipCode || !type || !description)
    {
        req.flash('message', 'Missing required input field(s).');
        return req.session.save((err) => {
            if (err) { return next(err); }
            res.redirect('/places/add');
        });
    }

    const newPlace = new Place({
        owner: ownerId,
        name: placeName,
        type: type,
        lotNumber: lotNumber,
        streetName: streetName,
        subdivision: subdivision,
        barangay: barangay,
        city: city,
        province: province,
        zipCode: zipCode,
        description: description
    });

    newPlace.save((err) => {
        if (err) { return next(err); }

        req.flash('message', `${placeName} has been listed.`);
        return req.session.save((err) => {
            if (err) { return next(err); }
            res.redirect('/profile');
        });
    }); 
});

module.exports = placesRouter;
