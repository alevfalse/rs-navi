const placesRouter = require('express').Router();
const upload = require('../../config/upload');

// GET rsnavigation.com/places/add
placesRouter.get('/add', (req, res) => {
    return res.render('add-place');
});

// POST rsnavigation.com/places/add
placesRouter.post('/add', upload.single('file'), (req, res) => {
    return res.json({ file: req.file });
});

module.exports = placesRouter;

