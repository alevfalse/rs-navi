const mongoose = require('mongoose');
const generate = require('nanoid/generate');
const alpha = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// model for emails subscribed in our mailing list
const ImageSchema = new mongoose.Schema({
    _id: { type: String, default: () => generate(alpha, 10) },
    filename: String,
    url: String,
    contentType: String,
    status: { type: Number, default: 1 },
    created: { type: Date, default: new Date() }
});

/* status types
0 - deleted
1 - visible
*/

module.exports = mongoose.model('Image', ImageSchema);