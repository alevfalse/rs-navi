const fs = require('fs')
const path = require('path');
const sharp = require('sharp');
const generate = require('nanoid/generate');

const options = {
    alpha: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    directory: path.join(__dirname, '../uploads/')
}

class CustomStorage {
    constructor(opts = options) {
        this.alpha = opts.alpha;
        this.uploadsDirectory = opts.directory;
    }

    _handleFile(req, file, callback) {
        fs.existsSync(this.uploadsDirectory) || fs.mkdirSync(this.uploadsDirectory);

        const filename = this.generateFilename()
        const filePath = path.join(this.uploadsDirectory, filename);

        // create a writable stream to the file path
        const outStream = fs.createWriteStream(filePath);

        console.log(filePath);

        // pipe the file stream to the writable stream thus saving the file to the path
        file.stream.pipe(outStream);
    
        outStream.on('error', callback)

        // when the file stream finishes uploading the file
        outStream.on('finish', () => {

            // resize the uploaded file and return it as a buffer
            sharp(filePath).toFormat('jpg')
                .resize({ width: 200 })
                .toBuffer((err, buffer, info) => {
                    if (err) { return callback(err); }

                    // replace the uploaded file with the resized version
                    fs.writeFileSync(filePath, buffer);

                    console.log(info);

                    callback(null, {
                        filename: filename,
                        path: filePath,
                        size: outStream.bytesWritten
                    });
                });
        });
    }

    _removeFile(req, file, cb) {
        console.log(`Removing: ${file.path}`);
        fs.unlink(file.path, cb)
    }

    generateFilename() {
        return generate(this.alpha, 8) + '.jpg';
    }
}

module.exports = CustomStorage;