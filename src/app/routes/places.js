const fs = require('fs');
const path = require('path');
const uploadsDirectory = path.join(__dirname, '../../uploads/');

const placesRouter = require('express').Router();
const Report = require('../models/report');
const Image = require('../models/image');
const Review = require('../models/review');
const Place = require('../models/place');



// =======================================================================================
// MIDDLEWARES ===========================================================================

const sanitizer = require('../../bin/sanitizer');
const upload = require('../../config/upload');

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        req.flash('message', 'You have to be logged in.');
        req.session.save(err => err ? next(err) : res.redirect('/auth'));
    }
}

function isAuthorizedStudent(req, res, next) {
    if (req.isAuthenticated() && req.user.account.role === 0) {
        next();
    } else {
        req.flash('message', 'You have to be logged in as student.');
        req.session.save(err => err ? next(err) : res.redirect('/auth'));
    }
}

function isAuthorizedPlaceowner(req, res, next) {
    if (req.isAuthenticated() && req.user.account.role === 1) {
        next();
    } else {
        req.flash('message', 'You have to be logged in as student.');
        req.session.save(err => err ? next(err) : res.redirect('/auth?placeowner=1'));
    }
}



// =======================================================================================
// GET ROUTES ============================================================================

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
placesRouter.get('/:id', sanitizer, (req, res, next) => {

    // TODO: Sanitize params
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

    return next(); // removed

    // TODO: Sanitize params
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

    // TODO: Sanitize params
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



// =======================================================================================
// POST ROUTES ===========================================================================

// POST rsnavigation.com/places/add
placesRouter.post('/add', isAuthorizedPlaceowner, sanitizer, upload.array('images', 10),
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

    // TODO: Min and max characters, check for invalid characters
    console.log(req.body);

    const ownerId     = req.user._id;
    const name        = req.body.name;
    const placeType   = req.body.placeType;

    let coordinates   = req.body.coordinates

    // address
    const number      = req.body.number;
    const street      = req.body.street;
    const subdivision = req.body.subdivision;
    const barangay    = req.body.barangay;
    const city        = req.body.city;
    const zipCode     = req.body.zipCode;
    const province    = req.body.province;

    let price         = req.body.price
    const listType    = req.body.listType;
    let floors      = req.body.floors;
    let bedrooms    = req.body.bedrooms;
    let bathrooms   = req.body.bathrooms;
    let description = req.body.description;

    if (!ownerId || !name || !placeType || !number || !street || !city 
        || !province || !price || !listType || !description || !coordinates)
    {
        req.flash('message', 'Missing required input field(s).');
        return req.session.save(err => err ? next(err) : res.redirect('/places/add'));
    }

    // TODO: Make specific errors for each field & client-side validation
    if (zipCode.match(/[^\d]/) || price.match(/[^\d]/) || floors.match(/[^\d]/) 
        || bedrooms.match(/[^\d]/) || bathrooms.match(/[^\d]/))
    {
        req.flash('message', 'Number field(s) contain invalid characters.');
        return req.session.save(err => err ? next(err) : res.redirect('/places/add'));
    }

    coordinates = coordinates.split(',');
    price = price.replace(/[^\d\.]/g, ''); // delete all non-digit characters
    description = description.replace(/\n/g, '<br>') // replace all new lines with <br>

    if (floors) floors = floors.replace(/[^\d\.]/g, '');
    if (bedrooms) bedrooms = bedrooms.replace(/[^\d\.]/g, '');
    if (bathrooms) bathrooms = bathrooms.replace(/[^\d\.]/g, '');
    
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
        
        floors: floors,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        
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

// POST rsnavigation.com/places/:id/review
placesRouter.post('/:id/review', isAuthorizedStudent, sanitizer, (req, res, next) => {

    const id = req.params.id;
    const comment = req.body.comment.replace(/\n/g, '<br>'); // replace all new lines with <br>
    const rating = req.body.rating;

    if (!comment || !rating) {
        req.flash('message', 'Please provide a comment.');
        return req.session.save(err => err ? next(err) : res.redirect(`/places//${id}`));
    }

    if (!rating) {
        req.flash('message', 'Please provide a rating.');
        return req.session.save(err => err ? next(err) : res.redirect(`/places/${id}`));
    }

    // TODO: Clientside validation of comment length
    if (comment.length > 1000) {
        req.flash('message', 'Comment must not be more than 1000 characters.');
        return req.session.save(err => err ? next(err) : res.redirect(`/places/${id}`));
    }

    if (rating !== '1' && rating !== '2' && rating !== '3' && rating !== '4' && rating !== '5') {
        req.flash('message', 'Invalid stars.');
        return req.session.save(err => err ? next(err) : res.redirect(`/places/${id}`));
    }

    const newReview = new Review({
        author: req.user._id,
        rating: rating,
        comment: comment
    });

    console.log(newReview);

    newReview.save(err => {
        if (err) { return next(err); }

        Place.findById(id, 'reviews', (err, place) => {
            if (err || !place) { return next(err); }

            // TODO: Check if already submitted a review
            
            place.reviews.push(newReview._id);
            place.save(err => err ? next(err) : res.redirect(`/places/${id}`))
        });
    });
});

// POST rsnavigation.com/places/:id/report
placesRouter.post('/:id/report', isAuthenticated, sanitizer, (req, res, next) => {

    const id = req.params.id; // place's id
    const reason = req.body.reason;

    if (!id || id.length < 10) {
        req.logout();
        req.flash('message', 'Bad request.'); // !!!
        return req.session.save(err => err ? next(err) : res.redirect('/auth'));
    }

    if (!reason) {
        req.flash('message', 'Provide a reason for reporting.');
        return req.session.save(err => err ? next(err) : res.redirect(`/places/${id}`));
    }

    if (reason.length > 50) {
        req.flash('message', 'Report reason must not be more than 50 characters.');
        return req.session.save(err => err ? next(err) : res.redirect(`/places/${id}`));
    }
    
    Place.findOne({ '_id': id, 'owner': { '$ne': req.user._id } })
    .populate('reports')
    .exec((err, place) => {
        if (err || !place) { return next(err); }

        console.log(place.reports);

        // Check first if the user has already submitted a report on the place
        if (place.reports.find(report => report.author === req.user._id)) {
            req.flash('message', 'You have already submitted a report.');
            return req.session.save(err => err ? next(err) : res.redirect(`/places/${id}`));
        }

        const newReport = new Report({
            place: place._id,
            author: req.user._id,
            reason: reason
        });

        newReport.save(err => {
            if (err) { return next(err); }

            place.reports.push(newReport._id);
            place.save(err => {
                if (err) { return next(err );}

                req.flash('message', 'Report submitted.');
                req.session.save(err => err ? next(err) : res.redirect(`/places/${id}`));
            });
        });
    });
});

// =======================================================================================
// DELETE ROUTES =========================================================================

// DELETE rsnavigation.com/places/:id/images/:filename
placesRouter.delete('/:id/images/:filename', isAuthorizedPlaceowner, sanitizer, (req, res, next) => {
    
    Place.findOne({ '_id': req.params.id, 'owner': req.user._id }, 'images')
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

// TODO: DELETE review route

module.exports = placesRouter;
