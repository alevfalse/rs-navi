const profileRouter = require('express').Router();
const fs = require('fs');
const path = require('path');
const sanitize = require('../../bin/sanitizer');
const audit = require('../../bin/auditor');

// models
const User = require('../models/user');

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

// rate limiters
const RateLimitMongoStore = require('rate-limit-mongo');
const RateLimit = require('express-rate-limit');
const dbURI = require('../../config/database');

const updateProfileRateLimiter = RateLimit({
    store: new RateLimitMongoStore({ 
        uri: dbURI,
        collectionName: 'updateProfileHits',
        expireTimeMs: 5 * 60 * 1000 // 5 minutes
    }),
    max: 5, // limit each IP to 5 reviews submitted per expireTimeMs
    handler: function(req, res, next) {
        req.flash('message', 'Too many update profile requests.<br>Please try again later.');
        req.session.save(err => err ? next(err) : res.redirect(`/profile`));
    }
});

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

profileRouter.post('/update', isAuthenticated, updateProfileRateLimiter, async (req, res, next) => {

    const firstName          = sanitize(req.body.firstName);
    const lastName           = sanitize(req.body.lastName);
    const schoolName         = sanitize(req.body.schoolName);
    const licenseType        = sanitize(req.body.licenseType);
    const contactNumber      = sanitize(req.body.contactNumber);
    const newPassword        = sanitize(req.body.newPassword);
    const confirmNewPassword = sanitize(req.body.confirmNewPassword);
    const currentPassword    = sanitize(req.body.currentPassword);

    if (!await req.user.verifyPassword(currentPassword)) {
        req.flash('message', 'Incorrect password.');
        return req.session.save(err => err ? next(err) : res.redirect('/profile'));
    }

    const oldFirstName = req.user.firstName;
    const oldLastName = req.user.lastName;
    const oldContactNumber = req.user.contactNumber;
    const oldSchoolName = req.user.schoolName;
    const oldLicenseType = req.user.licenseTypeString;

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

                audit.userProfileUpdate(req.user._id, req.ip, { key: 'password' });

                if (firstName) { audit.userProfileUpdate(req.user._id, req.ip, {
                        key: 'First Name',
                        old: oldFirstName,
                        new: req.user.firstName
                    }); 
                }

                if (lastName) { 
                    audit.userProfileUpdate(req.user._id, req.ip, {
                        key: 'Last Name',
                        old: oldLastName,
                        new: req.user.lastName
                    }); 
                }
                
                if (contactNumber) { 
                    audit.userProfileUpdate(req.user._id, req.ip, {
                        key: 'Contact Number',
                        old: oldContactNumber,
                        new: req.user.contactNumber
                    }); 
                }

                if (req.user.account.role === 0 && schoolName) { 
                    audit.userProfileUpdate(req.user._id, req.ip, { 
                        key: 'School Name',
                        old: oldSchoolName,
                        new: req.user.schoolName
                    });
                } else if (req.user.account.role === 1 && licenseType) {
                    audit.userProfileUpdate(req.user._id, req.ip, {
                        key: 'License Type',
                        old: oldLicenseType,
                        new: req.user.licenseTypeString
                    });
                }
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
            
            if (firstName) { 
                audit.userProfileUpdate(req.user._id, req.ip, {
                    key: 'First Name',
                    old: oldFirstName,
                    new: req.user.firstName
                });
            }

            if (lastName) { 
                audit.userProfileUpdate(req.user._id, req.ip, {
                    key: 'Last Name',
                    old: oldLastName,
                    new: req.user.lastName
                }); 
            }
            
            if (contactNumber) { 
                audit.userProfileUpdate(req.user._id, req.ip, {
                    key: 'Contact Number',
                    old: oldContactNumber,
                    new: req.user.contactNumber
                }); 
            }

            if (req.user.account.role === 0 && schoolName) {
                audit.userProfileUpdate(req.user._id, req.ip, {
                    key: 'School Name',
                    old: oldSchoolName,
                    new: req.user.schoolName
                });
            } else if (req.user.account.role === 1 && licenseType) {
                audit.userProfileUpdate(req.user._id, req.ip, {
                    key: 'License Type',
                    old: oldLicenseType,
                    new: req.user.licenseTypeString
                });
            }
        });
    }
});

// POST rsnavigation.com/profile/image/update
profileRouter.post('/image/update', isAuthenticated, updateProfileRateLimiter, upload.single('image'),
(err, req, res, next) => {
    req.flash('message', err.message);
    req.session.save(err => err ? next(err) : res.redirect('/profile'));
},
(req, res, next) => {
    if (req.file) {
        const oldImage = req.user.image ? req.user.image.filename : 'No Image';
        req.user.updateImage(req.file, (err) => {
            if (err) { return next(err); }
            res.redirect('/profile');
            audit.userProfileUpdate(req.user._id, req.ip, {
                key: 'Profile Image'
            });
        });
    } else {
        req.flash('message', 'Invalid image file.');
        req.session.save(err => err ? next(err) : res.redirect('/profile'));
    }
});

module.exports = profileRouter;
