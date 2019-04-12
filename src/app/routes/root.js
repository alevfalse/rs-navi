const fs = require('fs');
const path = require('path');

const openRouter = require('express').Router();
const Place = require('../models/place');
const Image = require('../models/image');
const Student = require('../models/student');
const Placeowner = require('../models/placeowner');

const upload = require('../../config/upload');
const uploadDir = path.join(__dirname, '../../uploads/');

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

openRouter.get('/', (req, res, next) => {
    res.render('index', { user: req.user, message: req.flash('message') },
    (err, html) => {
        if (err) { return next(err); }
        res.send(html);
    });
});

openRouter.get('/search', (req, res, next) => {

    const query = req.query.schoolName;

    console.log(`Query: ${query}`);

    if (!query) {
        req.flash('message', 'Please provide a school name.');
        return req.session.save((err) => { 
            if (err) { return next(err); }
            res.redirect('/');
        });

    } else if (query.length <= 1) {
        req.flash('message', 'School name is too short.');
        return req.session.save((err) => { 
            if (err) { return next(err); }
            res.redirect('/');
        });
    }

    // TODO: Only send nearby places (same city?)
    Place.find((err, places) => {
        if (err) { res.send(null); }
        res.send(places);
    });
})

// TODO: Create profile route
openRouter.get('/profile', isAuthenticated, (req, res, next) => {
    res.render('profile',
    { 'user': req.user, 'message': req.flash('message') },
    (err, html) => {
        if (err) { return next(err); }
        res.send(html);
    });
});

openRouter.get('/profile/:id', (req, res, next) => {

    // redirect to profile page if the provided is the same as the user
    if (req.isAuthenticated() && req.user.id === req.params.id) {
        return res.redirect('/profile');
    }

    // TODO: Create visited profile page
    return next(); //temp

    if (req.params.id.startsWith('0')) {
        process.nextTick(() => {

            Student.findById(req.params.id)
            .populate({ 
                path: 'image',
                model: 'Image',
                match: { filename: req.params.filename }
            })
            .exec((err, student) => {
                if (err) { return next(err); }
                if (!student || !student.image) { return next(); }

                res.render('visited-profile', 
                { 'user': req.user, 'visited': student, 'message': req.flash('message') },
                (err, html) => {
                    if (err) { return next(err); }
                    res.send(html);
                });
            });
        });

    } else if (req.params.id.startsWith('1')) {
        process.nextTick(() => {

            Placeowner.findById(req.params.id, 'image')
            .populate({ 
                path: 'image',
                model: 'Image',
                match: { filename: req.params.filename },
            })
            .exec((err, placeowner) => {
                if (err) { return next(err); }
                if (!placeowner || !placeowner.image) { return next(); }

                res.render('visited-profile',
                { 'user': req.user, 'visited': placeowner, 'message': req.flash('message') },
                (err, html) => {
                    if (err) { return next(err); }
                    res.send(html);
                });
            });
        });

    } else {
        return next();
    }
});

// TODO: Imitate this algorithm to other routes
openRouter.get('/profile/:id/image/:filename', (req, res, next) => {

    if (req.params.id.startsWith('0')) {
        process.nextTick(() => {

            Student.findById(req.params.id, 'image')
            .populate({ 
                path: 'image',
                model: 'Image',
                match: { filename: req.params.filename }
            })
            .exec((err, student) => {
                if (err) { return next(err); }
                if (!student || !student.image) { return next(); }

                if (fs.existsSync(uploadDir + student.image.filename)) {
                    return res.sendFile(student.image.filename, { root: uploadDir });
                } else {
                    return next();
                }
            });
        });

    } else if (req.params.id.startsWith('1')) {
        process.nextTick(() => {

            Placeowner.findById(req.params.id, 'image')
            .populate({ 
                path: 'image',
                model: 'Image',
                match: { filename: req.params.filename },
            })
            .exec((err, placeowner) => {
                if (err) { return next(err); }
                if (!placeowner || !placeowner.image) { return next(); }

                if (fs.existsSync(uploadDir + placeowner.image.filename)) {
                    return res.sendFile(placeowner.image.filename, { root: uploadDir });
                } else {
                    return next();
                }
            });
        });

    } else {
        return next();
    }
});

openRouter.post('/profile/update', isAuthenticated, upload.single('image'), 
(req, res, next) => {

    if (req.file) {

        const file = req.file;
        const image = new Image({
            filename: file.filename,
            url: `/profile/${req.user.id}/image/` + file.filename,
            contentType: file.mimetype
        });

        image.save((err) => {
            if (err) { return next(err); }

            switch (req.user.account.role)
            {
                case 0: {
                    process.nextTick(() => {

                        Student.findByIdAndUpdate(req.user.id, 
                        { 'image': image._id }, 
                        (err, student) => {
                            if (err) { return next(err); }
                            if (!student) { return next(); }

                            req.flash('message', 'Updated profile picture.');
                            req.session.save((err) => { 
                                if (err) { return next(err); }
                                res.redirect('/profile');
                            });
                        });
                    });
                } break;
        
                case 1: {
                    process.nextTick(() => {
                        Placeowner.findByIdAndUpdate(req.user.id, 
                        { 'image': image._id }, 
                        (err, placeowner) => {
                            if (err) { return next(err); }
                            if (!placeowner) { return next(); }

                            req.flash('message', 'Updated profile picture.');
                            req.session.save((err) => { 
                                if (err) { return next(err); }
                                res.redirect('/profile');
                            });
                        });
                    });
                } break;

                default: return next();
            }
        });
        
    } else {
        res.redirect('/profile');
    }
})

module.exports = openRouter;