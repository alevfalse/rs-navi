const profileRouter = require('express').Router();
const fs = require('fs');
const path = require('path');
const sanitize = require('../../bin/sanitizer');

// models
const User = require('../models/user');
const Place = require('../models/place');

// directories
const uploadsDirectory = path.join(__dirname, '../../uploads/');
const publicImagesDirectory = path.join(__dirname, '../../public/images');



// =======================================================================================
// MIDDLEWARES ===========================================================================

const upload = require('../../config/upload');

// check if a user is logged in
function isAuthenticated(req, res, next) {
    req.isAuthenticated() ? next() : res.redirect('/auth');
}



// =======================================================================================
// GET ROUTES ============================================================================

// GET rsnavigation.com/profile 
profileRouter.get('/', (req, res, next) => {
    if (req.isAuthenticated()) {
        res.redirect(`/profile/${req.user._id}`);
    } else {
        res.redirect('/auth');
    }
});

// GET rsnavigation.com/profile/:id
profileRouter.get('/:id', (req, res, next) => {
    User.findOne({ '_id': sanitize(req.params.id), 'account.status': 1 }).populate('image')
    .populate({
        path: 'places',
        populate: {
            path: 'reviews images'
        }
    }).exec((err, user) => {
        if (err || !user) { return next(err); }
        res.render('profile', { 'user': req.user, 'visited': user, 'message': req.flash('message') },
        (err, html) => err ? next(err) : res.send(html));
    });
});

// GET rsnavigation.com/profile/:id/image
profileRouter.get('/:id/image', (req, res, next) => {

    User.findById(sanitize(req.params.id), 'image').populate('image')
    .exec((err, user) => {
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



// =======================================================================================
// POST ROUTES ===========================================================================

profileRouter.post('/update', isAuthenticated, async (req, res, next) => {

    const firstName          = sanitize(req.body.firstName);
    const lastName           = sanitize(req.body.lastName);
    const schoolName         = sanitize(req.body.schoolName);
    const licenseType        = sanitize(req.body.licenseType);
    const contactNumber      = sanitize(req.body.contactNumber);
    const newPassword        = sanitize(req.body.newPassword);
    const confirmNewPassword = sanitize(req.body.confirmNewPassword);
    const currentPassword    = sanitize(req.body.currentPassword);

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

    if (firstName)     { req.user.firstName     = firstName;     }
    if (lastName)      { req.user.lastName      = lastName;      }
    if (contactNumber) { req.user.contactNumber = contactNumber; }


    if (req.user.account.role === 0 && schoolName) { 
        req.user.schoolName = schoolName;
    } else if (req.user.account.role === 1 && licenseType) {
        if (licenseType !== '0' && licenseType !== '1' && licenseType !== '2' && licenseType !== '3') {
            req.flash('message', 'Invalid license type.');
            return req.session.save(err => err ? next(err) : res.redirect('/profile'));
        }

        if (licenseType === '0') { req.user.license.status = 0; }
        else { req.user.license.status = 1; }

        req.user.license.type = licenseType;
    }

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
