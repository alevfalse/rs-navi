const profileRouter = require('express').Router();
const fs = require('fs');
const path = require('path');

const User = require('../models/user');
const Place = require('../models/place');

const logger = require('../../config/logger');
const upload = require('../../config/upload');
const uploadsDirectory = path.join(__dirname, '../../uploads/');
const publicImagesDirectory = path.join(__dirname, '../../public/images');

// a middleware to check if a user is logged in
function isAuthenticated(req, res, next) {

    if (req.isAuthenticated()) {
        if (req.user.account.role === 7) {
            res.redirect('/');
        } else {
            next();
        }
    } else {
        res.redirect('/auth');
    }
}

// GET rsnavigation.com/profile 
profileRouter.get('/', isAuthenticated, (req, res, next) => {
    logger.info(req.user);
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
});

// GET rsnavigation.com/profile/:id/image
profileRouter.get('/:id/image', (req, res, next) => {

    User.findById(req.params.id, 'image', (err, user) => {
        if (err || !user || !user.image) { return next(err); }

        // check if the image exists in the file system
        if (fs.existsSync(uploadsDirectory + user.image.filename)) {
            return res.sendFile(user.image.filename, { root: uploadsDirectory });
        } else {
            user.removeImage(err => {
                if (err) { return next(err); }
                res.sendFile('blank.jpg', { root: publicImagesDirectory });
            });
        }
    });
});

// GET rsnavigation.com/profile/:id/places
profileRouter.get('/:id/places', (req, res, next) => {
    Place.find({ 'owner': req.params.id, 'status': 1 })
    .populate('owner')
    .exec((err, places) => {
        if (err) { return next(err); }
        res.render('places', { 'user': req.user, 'places': places, 'message': req.flash('message') }, 
        (err, html) => err ? next(err) : res.send(html));
    });
});

profileRouter.post('/update', isAuthenticated, async (req, res, next) => {

    const firstName          = req.body.firstName;
    const lastName           = req.body.lastName;
    const schoolName         = req.body.schoolName;
    const contactNumber      = req.body.contactNumber;

    const newPassword        = req.body.newPassword;
    const confirmNewPassword = req.body.confirmNewPassword;
    const currentPassword    = req.body.currentPassword;

    if (!firstName && !lastName && !schoolName && !contactNumber 
        && !newPassword && confirmNewPassword)
    {
        req.flash('message', 'No profile data updated.');
        return req.session.save(err => err ? next(err) : res.redirect('/profile'));
    }

    if (!await req.user.verifyPassword(currentPassword)) {
        req.flash('message', 'Incorrect password.');
        return req.session.save(err => err ? next(err) : res.redirect('/profile'));
    }

    if (firstName)     { req.user.firstName     = firstName     };
    if (lastName)      { req.user.lastName      = lastName      }; 
    if (contactNumber) { req.user.contactNumber = contactNumber };

    if (schoolName && req.user.account.role === 0) { req.user.schoolName = schoolName };  

    if (newPassword || confirmNewPassword) {

        // TODO: show update profile on redirect
        if (newPassword.length < 8) {
            req.flash('message', 'Password must be at least 8 characters.');
            return req.session.save(err => err ? next(err) : res.redirect('/profile')); 
        }

        if (newPassword === confirmNewPassword) {

            req.user.updatePassword(newPassword, (err) => {
                if (err) { return next(err); }
                req.flash('message', 'Updated profile.');
                req.session.save(err => err ? next(err) : res.redirect('/profile'));
            });

        } else {
            req.flash('message', 'Passwords do not match.');
            req.session.save(err => err ? next(err) : res.redirect('/profile'));
        }

    } else {
        req.user.save(err => {
            if (err) { return next(err); }
            req.flash('message', 'Updated profile.');
            req.session.save(err => err ? next(err) : res.redirect('/profile'));
        });
    }
});

// POST rsnavigation.com/profile/image/update
profileRouter.post('/image/update', isAuthenticated, upload.single('image'),
(err, req, res, next) => {
    req.flash('message', err.message);
    req.session.save(err => err ? next(err) : res.redirect('/profile'));
},   
(req, res, next) => {
    if (req.file) {
        req.user.updateImage(req.file, (err) => err ? next(err) : res.redirect('/profile'));
    } else {
        req.flash('message', 'Invalid image file.');
        req.session.save(err => err ? next(err) : res.redirect('/profile'));
    }
});

module.exports = profileRouter;
