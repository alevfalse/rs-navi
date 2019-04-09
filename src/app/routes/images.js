const imagesRouter = require('express').Router();
const upload = require('../../config/grid-fs-storage');
// GridFS Stream
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const database = require('../../config/database');

let uri;
switch (process.env.MODE)
{
case 'dev':   uri = database.devURI;   break;
case 'prod':  uri = database.prodURI;  break;
case 'local': uri = database.localURI; break;
default: return console.error('Invalid MODE environment variable value.');
}

const conn = mongoose.createConnection(uri, { useNewUrlParser: true });
conn.once('open', () => {
    console.log('GridFS Connection Opened.');
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
});

imagesRouter.get('/', (req, res, next) => {
    gfs.files.find().toArray((err, files) => {
        if (err) { return console.error(err); }

        if (!files || files.length === 0) {
            res.render('image', { files: false });
        } else {
            files.map(file => {
                if (
                    file.contentType === 'image/jpeg' ||
                    file.contentType === 'image/png'  ||
                    file.contentType === 'image/gif'
                ){
                    file.isImage = true;
                } else {
                    file.isImage = false;
                }
            });
            res.render('images', { message: req.flash('message'), files: files });
        }
    });
});

imagesRouter.get('/:filename', (req, res, next) => {
    gfs.files.findOne({ filename: req.params.filename}, (err, file) => {
        if (err) { return next(err); }
        if (!file) { return res.status(404).send(null); }
        return gfs.createReadStream({ _id: file._id }).pipe(res);
    });
});

imagesRouter.post('/', upload.array('file', 3), (req, res, next) => {
    if (req.files.length > 5) {
        req.flash('message', 'Exceeded maximum number of images.');
        req.session.save((err) => {
            if (err) { return next(err); }
            res.redirect('/images');
        })
    } else {
        res.redirect('/images');
    }
});

imagesRouter.delete('/:id', (req, res, next) => {
    gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
        if (err) { return next(err); }
        res.redirect('/images');
    });
});

module.exports = imagesRouter;