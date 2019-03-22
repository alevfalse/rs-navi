const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const mongoose = require('mongoose');

const connection = mongoose.connect(require('./database').uri, { useNewUrlParser: true });

let gfs;
// initialize stream
connection.then((client) => {
    console.log(`Database Connection Opened for GridFS.`)
    gfs = Grid(client.connection, mongoose.mongo);
    gfs.collection('uploads');
})

const storage = new GridFsStorage({
    db: connection,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(12, (err, buffer) => {
                if (err) { return reject(err); }
                const fileInfo = {
                    filename: buffer.toString('hex') + path.extname(file.originalname),
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    }
});

const upload = multer({ storage });

module.exports = upload;