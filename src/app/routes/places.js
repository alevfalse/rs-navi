const fs = require('fs');
const path = require('path');

const placesRouter = require('express').Router();
const Image = require('../models/image');
const Review = require('../models/review');
const Place = require('../models/place');

const upload = require('../../config/upload');
const uploadsDirectory = path.join(__dirname, '../../uploads/');

// middleware
function isAuthorizedStudent(req, res, next) {
    if (req.isAuthenticated() && req.user.account.role === 0) {
        return next();
    } else {
        req.flash('message', 'You must be logged in as student.');
        req.session.save(err => err ? next(err) : res.redirect('/auth'));
    }
}

function isAuthorizedPlaceowner(req, res, next) {
    if (req.isAuthenticated() && req.user.account.role === 1) {
        return next();
    } else {
        return res.redirect('/auth?placeowner=1');
    }
}

// GET rsnavigation.com/places
placesRouter.get('/', (req, res, next) => {

    return next(); // removed

    Place.find({ 'status': 1 })
    .populate('owner images reviews')
    .exec((err, places) => {
        if (err) { return next(err); }
        res.render('places', { 'user': req.user, 'places': places, 'message': req.flash('message') }, 
        (err, html) => err ? next(err) : res.send(html));
    });
});

// GET rsnavigation.com/places/add
placesRouter.get('/add', isAuthorizedPlaceowner, (req, res, next) => {
    res.render('add-place', { user: req.user, message: req.flash('message') }, 
    (err, html) => err ? next(err) : res.send(html));
});

// GET rsnavigation.com/places/:id
placesRouter.get('/:id', (req, res, next) => {
    Place.findById(req.params.id)
    .populate('images')
    .populate({
        path: 'owner',
        populate: { path: 'account image' }
    })
    .populate({
        path: 'reviews',
        options: { sort: { 'created': -1 } },
        populate: { path: 'author' }
    })
    .exec((err, place) => {
        if (err || !place) { return next(err) }

        for (let rev of place.reviews) { console.log(rev.created) }

        const data = { 
            place: place, 
            user: req.user, 
            message: req.flash('message')
        }
        
        res.render('place-details', data,
        (err, html) => err ? next(err) : res.send(html));
    });
});

// GET rsnavigation.com/places/:id/images/
placesRouter.get('/:id/images/', (req, res, next) => {
    Place.findById(req.params.id, 'name images')
    .populate('images')
    .exec((err, place) => {
        if (err || !place) { return next (err); }
        res.render('images', { 'message': req.flash('message'), place: place }, 
        (err, html) => err ? next(err) : res.send(html));
    });
});

// GET rsnavigation.com/places/:id/images/:filename
placesRouter.get('/:id/images/:filename', (req, res, next) => {
    Place.findById(req.params.id, 'images')
    .populate({
        path: 'images',
        select: '_id filename',
        match: { 'filename': req.params.filename, 'status': 1 }
    })
    .exec((err, place) => {
        if (err || !place || place.images.length == 0) { return next(err); }

        const image = place.images[0];

        // if the file exists in the server's file system
        if (fs.existsSync(uploadsDirectory + image.filename)) {
            return res.sendFile(image.filename, { root: uploadsDirectory });

        // if the file is not found in the server's file system
        } else {
            image.delete(); 
            place.removeImage(image._id, (err) => err ? next(err) : next());
        }
    });
});

placesRouter.post('/:id/review', isAuthorizedStudent, (req, res, next) => {

    const comment = req.body.comment.replace(/\n/g, '<br>'); // replace all new lines with <br>
    const rating = req.body.rating;

    const newReview = new Review({
        author: req.user._id,
        rating: rating,
        comment: comment
    });

    console.log(newReview);

    newReview.save(err => {
        if (err) { return next(err); }

        Place.findById(req.params.id, 'reviews', (err, place) => {
            if (err || !place) { return next(err); }

            place.reviews.push(newReview._id);
            place.save(err => err ? next(err) : res.redirect(`/places/${req.params.id}`))
        });
    });
});

// DELETE rsnavigation.com/places/:id/images/:filename
placesRouter.delete('/:placeId/images/:filename', isAuthorizedPlaceowner, (req, res, next) => {
    
    Place.findOne({ '_id': req.params.placeId, 'owner': req.user.id }, 'images')
    .populate({
        path: 'images',
        select: '_id filename',
        match: { filename: req.params.filename, status: 1 }
    })
    .exec((err, place) => {
        if (err || !place || place.images.length === 0) { return next(err); }

        const image = place.images[0];

        image.delete(); // set the image's status to deleted

        place.removeImage(image._id, (err) => {
            if (err) { return next(err); }
            res.redirect(`/places/${req.params.placeId}/images`);
        });
    });
});

// POST rsnavigation.com/places/add
placesRouter.post('/add', isAuthorizedPlaceowner, upload.array('images', 10),
(err, req, res, next) => {
    if (err) {
        req.flash('message', err.message);
        req.session.save((err) => {
            if (err) { return next(err); }
            res.redirect('/places/add');
        });
    } else {
        next();
    }
},
(req, res, next) => {

    console.log(req.body);

    const ownerId     = req.user.id;
    const name        = req.body.name;
    const placeType   = req.body.placeType;

    // address
    const number      = req.body.number;
    const street      = req.body.street;
    const subdivision = req.body.subdivision;
    const barangay    = req.body.barangay;
    const city        = req.body.city;
    const zipCode     = req.body.zipCode;
    const province    = req.body.province;

    const price       = req.body.price.replace(/[^\d\.]/g, '') // delete all non-digit characters
    const listType    = req.body.listType;
    const description = req.body.description.replace(/\n/g, '<br>') // replace all new lines with <br>
    const coordinates = req.body.coordinates.split(',');

    if (!ownerId || !name || !placeType || !number || !street || !city 
        || !province || !price || !listType || !description || !coordinates)
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
            subdivision: subdivision || null,
            barangay: barangay || null,
            city: city,
            zipCode: zipCode || null,
            province: province
        },

        price: price,
        listType: listType,
        
        description: description,
        coordinates: {
            lat: coordinates[0],
            lng: coordinates[1]
        },
        images: []
    });

    for (let file of req.files) {

        const image = new Image({
            filename: file.filename,
            url: `/places/${newPlace._id}/images/` + file.filename,
            contentType: file.mimetype
        })

        newPlace.images.push(image._id);
        
        image.save((err) => {
            if (err) { return next(err); }
        })
    }
    
    newPlace.save((err) => {
        if (err) { return next(err); }

        req.flash('message', `${newPlace.name} has been added.`);
        req.session.save((err) => {
            if (err) { return next(err); }
            res.redirect('/places/add');
        });
    }); 
});

module.exports = placesRouter;
