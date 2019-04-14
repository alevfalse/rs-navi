const fs = require('fs');
const path = require('path');

const openRouter = require('express').Router();
const Place = require('../models/place');
const Image = require('../models/image');
const Student = require('../models/student');
const Placeowner = require('../models/placeowner');
const Admin = require('../models/admin');

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

    // TODO: Create visited profile page and refactor to to switch (id[0]) and shorten
    // you know what to do
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
openRouter.get('/profile/:id/image', (req, res, next) => {

    let query;

    switch(req.params.id[0])
    {
        case '0': query = Student.findById(req.params.id, 'image');    break;
        case '1': query = Placeowner.findById(req.params.id, 'image'); break;
        case '7': query = Admin.findById(req.params.id, 'image');      break;
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
            // TODO: update profile image of user
            return next();
        }
    });
});

openRouter.post('/profile/image/update', isAuthenticated, upload.single('image'),
(err, req, res, next) => {
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
        res.redirect('/profile');
    }
})

module.exports = openRouter;