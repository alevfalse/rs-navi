const profileRouter = require('express').Router();
const fs = require('fs');
const path = require('path');

const Student = require('../models/student');
const Placeowner = require('../models/placeowner');
const Place = require('../models/place');

const upload = require('../../config/upload');
const uploadDir = path.join(__dirname, '../../uploads/');
const publicImagesDirectory = path.join(__dirname, '../../public/images');

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

// GET rsnavigation.com/profile 
profileRouter.get('/', isAuthenticated, (req, res, next) => {
    res.render('profile',
    { 'user': req.user, 'message': req.flash('message') },
    (err, html) => {
        if (err) { return next(err); }
        res.send(html);
    });
});

// GET rsnavigation.com/profile/:id
profileRouter.get('/:id', (req, res, next) => {

    // redirect to profile page if the provided is the same as the user
    if (req.isAuthenticated() && req.user.id === req.params.id) {
        return res.redirect('/profile');
    }

    // TODO: Create visited profile page
    return next();

    
    
    let query = null;

    switch(req.params.id[0])
    {
        case '0': query = Student.findById(req.params.id); break;
        case '1': query = Placeowner.findById(req.params.id); break;
        default: return next(err);
    }

    query.populate({ path: 'image', match: { 'status': 1 }})
    .exec((err, user) => {
        if (err || !user || !user.image) { return next(err); }

        res.render('visited-profile', 
        { 'user': req.user, 'visited': user, 'message': req.flash('message') },
        (err, html) => err ? next(err) : res.send(html));
    });
});

// GET rsnavigation.com/profile/:id/image
profileRouter.get('/:id/image', (req, res, next) => {

    let query;

    switch(req.params.id[0])
    {
        case '0': query = Student.findById(req.params.id, 'image');    break;
        case '1': query = Placeowner.findById(req.params.id, 'image'); break;
        default: return next();
    }

    query.populate({ 
        path: 'image',
        model: 'Image',
        match: { 'status': 1 }
    })
    .exec((err, user) => {
        if (err || !user || !user.image) { return next(err); }

        // check if the image exists in the file system
        if (fs.existsSync(uploadDir + user.image.filename)) {
            return res.sendFile(user.image.filename, { root: uploadDir });
        } else {
            user.image.delete();
            user.image = null;
            user.save((err) => { 
                if (err) { return next(err); }
                res.sendFile('blank-profile-picture.jpg', { root: publicImagesDirectory });
            })
        }
    });
});

// GET rsnavigation.com/profile/:id/places
profileRouter.get('/:id/places', (req, res, next) => {
    Place.find({ 'owner': req.params.id, 'status': 1 })
    .populate('owner images')
    .exec((err, places) => {
        if (err) { return next(err); }
        res.render('places', { 'user': req.user, 'places': places, 'message': req.flash('message') }, 
        (err, html) => err ? next(err) : res.send(html));
    });
});

// POST rsnavigation.com/profile/image/update
profileRouter.post('/image/update', isAuthenticated, upload.single('image'),
(err, req, res, next) => {
    console.log(err);

    req.flash('message', err.message);
    req.session.save((err) => {
        if (err) { return next(err); }
        res.redirect('/profile');
    });
},   
(req, res, next) => {
    if (req.file) {
        req.user.updateProfileImage(req.file, (err) => {
            if (err) { return next(err); }
            res.redirect('/profile');
        });
    } else {
        console.log('No valid file given.');
        res.redirect('/profile');
    }
});

module.exports = profileRouter;
