const mongoose = require('mongoose');
const nanoid = require('../../bin/nanoid');
const formatDate = require('../../bin/date-formatter');

const ReviewSchema = new mongoose.Schema({
    _id: { type: String, default: () => nanoid(10) },
    place: { type: String, ref: 'Place' },
    author: { type: String, ref: 'Student' },
    rating: Number,
    comment: String,
    edited: { type: Boolean, default: false },
    status: { type: Number, default: 1 },
    created:   { type: Date, default: new Date() },
}); 

/* status types
-1 - flagged
 0 - deleted
 1 - visible
*/

ReviewSchema.virtual('dateString').get(function() {
    return formatDate(this.created);
});

module.exports = mongoose.model('Review', ReviewSchema);
