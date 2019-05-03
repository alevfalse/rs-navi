const fs = require('fs')
const path = require('path');
const logger = require('../config/logger');
const generate = require('../bin/generator');

class CustomStorage {
    constructor(directory = path.join(__dirname, '../uploads/')) {
        this.directory = directory;
    }

    _handleFile(req, file, callback) {
        fs.existsSync(this.directory) || fs.mkdirSync(this.directory);

        // generate a random file name
        const filename = generate() + '.jpg';
        const filePath = path.join(this.directory, filename);

        // create a writable stream to the file path
        const outStream = fs.createWriteStream(filePath);

        // pipe the file stream to the writable stream thus saving the file to the path
        file.stream.pipe(outStream);
    
        outStream.on('error', callback);

        // when the file stream finishes uploading the file
        outStream.on('finish', () => {
            logger.info(`New image file: ${filename}`);
            callback(null, {
                filename: filename,
                path: filePath,
                size: outStream.bytesWritten
            });
        });
    }

    _removeFile(req, file, callback) {
        fs.unlink(file.path, callback)
        logger.info(`Removed: ${file.path}`);
    }
}

module.exports = CustomStorage;