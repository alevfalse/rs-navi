const placesRouter = require('express').Router();
const Place = require('../models/place')
const Image = require('../models/image');

const generate = require('nanoid/generate');
const alpha = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const rootDir = path.join(__dirname, '../../uploads/');

// Multer Storage
const storage = multer.diskStorage({
    destination: function(req, file, callback) {
        if (file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/png' && file.mimetype !== 'image/gif') {
            return callback(new Error('Invalid file type.'), null);
        }
        callback(null, rootDir);
    },
    filename: function(req, file, callback) {
        const filename = generate(alpha, 6) + path.extname(file.originalname);
        callback(null, filename);
    }
});

const upload = multer({ storage: storage });

// Middleware Functions
function isAuthorized(req, res, next) {
    if (req.isAuthenticated() && req.user.account.role == 1) {
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

// GET rsnavigation.com/places/:id
placesRouter.get('/:id', (req, res, next) => {
    Place.findById(req.params.id, (err, place) => {
        if (err) { return next(err); }
        if (!place) { return next(); }
        res.json(place);
    })
});


// GET rsnavigation.com/places/:id/images/
placesRouter.get('/:id/images/', (req, res, next) => {

    Place.findById(req.params.id, { 'name': 1, 'images': 1 })
    .populate({
        path: 'images',
        model: 'Image',
        match: { status: 1 }
    }).exec((err, place) => {
        if (err) { return next(err); } 
        if (!place) { return next(); }
        res.render('images', { message: req.flash('message'), place: place, images: place.images });
    });
});

// GET rsnavigation.com/places/:id/images/:filename
placesRouter.get('/:id/images/:filename', (req, res, next) => {

    Image.findOne({ filename: req.params.filename, status: 1 }, { filename: 1 },(err, image) => {
        if (err) { return next(err); }
        if (!image) { return next(); } 

        // if the file exists in the server's file system
        if (fs.existsSync(rootDir + image.filename)) {
            res.sendFile(image.filename, { root: rootDir });
        } else {
            next(); // 404
        }
    });
});

// DELETE rsnavigation.com/places/:id/images/:filename
placesRouter.delete('/:placeId/images/:imageId', (req, res, next) => {

    // find the place with the provided id whose owner's id is the same as the user
    Place.findOne({ '_id': req.params.placeId, 'owner': req.user.id },
    (err, place) => {
        if (err) { return next(err); }
        if (!place) { return next(); }

        if (!place.images.includes(req.params.imageId)) {
            console.log(`${place.name} does not contain an image with that id.`);
            return next();
        }

        place.images.pull(req.params.imageId);
        place.save((err) => {
            if (err) { return next(err); }

            Image.findOneAndUpdate(
                { '_id': req.params.imageId, 'status': 1 },
                { 'status': 0 }, 

                (err, image) => {
                    if (err) { return next(err); }
                    if (!image) { return next(); }

                    return res.redirect(`/places/${req.params.placeId}/images`);
                }
            );
        });
    });
});

// POST rsnavigation.com/places/add
placesRouter.post('/add', isAuthorized, upload.array('images', 10), (req, res, next) => {

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

    const price       = req.body.price;
    const listType    = req.body.listType;
    const description = req.body.description;
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
            subdivision: subdivision,
            barangay: barangay,
            city: city,
            zipCode: zipCode,
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
            url: `/places/${newPlace.id}/images/` + file.filename,
            contentType: file.mimetype
        })

        newPlace.images.push(image.id);
        
        image.save((err) => {
            if (err) { return next(err); }
        })
    }
    
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
