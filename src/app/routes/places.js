const placesRouter = require('express').Router();
const upload = require('../../config/upload');

placesRouter.get('/add', (req, res) => {
    res.render('add-place');
});

placesRouter.post('/add', upload.single('file'), (req, res) => {
    res.json({ file: req.file });
});

module.exports = placesRouter;

