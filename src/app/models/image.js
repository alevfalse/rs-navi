const mongoose = require('mongoose');
const nanoid = require('../../bin/nanoid');

// model for emails subscribed in our mailing list
const ImageSchema = new mongoose.Schema({
    _id: { type: String, default: () => nanoid(10) },
    filename: String,
    url: String,
    contentType: String,
    status: { type: Number, default: 1 },
    createdAt: { type: Date, default: new Date() }
});

/* status types
0 - deleted
1 - visible
*/

ImageSchema.methods.delete = function() {
    this.status = 0;
    this.save((err) => {
        if (err) { console.error(err); }
        console.log(`Deleted: ${this.filename}`);
    });
}

module.exports = mongoose.model('Image', ImageSchema);
