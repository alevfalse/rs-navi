const mongoose = require('mongoose');
const generate = require('../../bin/generator');
const logger = require('../../config/logger');

// model for emails subscribed in our mailing list
const ImageSchema = new mongoose.Schema({
    _id: { type: String, default: generate() },
    status: { type: Number, default: 1 },
    createdAt: { type: Date, default: new Date() },
    filename: { type: String, required: true, index: true },
    url: { type: String, required: true },
    contentType: { type: String, required: true }
});

/* status types
0 - deleted
1 - visible
*/

ImageSchema.methods.delete = function(callback) {
    this.status = 0;
    this.save(err => {
        callback(err);
        if (!err) { logger.info(`Deleted: ${this.filename}`); }
    });
}

module.exports = mongoose.model('Image', ImageSchema);
