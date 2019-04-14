const path = require('path');
const fs = require('fs');
const multer = require('multer');
const generate = require('nanoid/generate');
const alpha = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const uploadsDir = path.join(__dirname, '../uploads/');

// create uploads folder if it doesn't exist
fs.existsSync(uploadsDir) || fs.mkdirSync(uploadsDir); 

// Multer Storage
const storage = multer.diskStorage({
    destination: function(req, file, callback) {
        if (file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/png' && file.mimetype !== 'image/gif') {
            return callback(new Error('Invalid file type.'), null);
        }
        callback(null, uploadsDir);
    },
    filename: function(req, file, callback) {
        const filename = generate(alpha, 8) + path.extname(file.originalname);
        console.log(`New Image: ${filename}`);
        callback(null, filename);
    }
});

const upload = multer({ 
    storage: storage, 
    limits: { fileSize: 5000000 } // maximum file size of 5 MB
}); 

module.exports = upload;
