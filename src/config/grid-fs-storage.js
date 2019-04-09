const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const mongoose = require('mongoose');
const database = require('./database');

let uri;

switch (process.env.MODE)
{
    case 'dev':   uri = database.devURI;   break;
    case 'prod':  uri = database.prodURI;  break;
    case 'local': uri = database.localURI; break;
    default: return console.error('Invalid MODE environment variable value.');
}

const connection = mongoose.connect(uri, { useNewUrlParser: true });

const storage = new GridFsStorage({
    db: connection,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buffer) => {
                if (err) { return reject(err); }
                const fileInfo = {
                    filename: buffer.toString('hex') + path.extname(file.originalname),
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    },
    cache: true
});

storage.ready().then(() => { console.log(`Multer GridFS Storage connected to ${process.env.MODE} database.`) });

const upload = multer({ storage });

module.exports = upload;