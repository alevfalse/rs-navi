const multer = require('multer');
const CustomStorage = require('./storage');

const storage = new CustomStorage();

const upload = multer({ 
    storage: storage, 
    limits: { files: 10, fileSize: 3000000 }, // 3 MB
    fileFilter: (req, file, cb) =>  cb(null, file.mimetype === 'image/jpeg' || file.mimetype === 'image/png')
});

module.exports = upload;
