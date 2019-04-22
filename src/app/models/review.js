const mongoose = require('mongoose');
const nanoid = require('../../bin/nanoid');

const ReviewSchema = new mongoose.Schema({
    _id: { type: String, default: () => nanoid(10) },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    rating: Number,
    comment: String,
    edited: { type: Boolean, default: false },
    status: { type: Number, default: 0 },
    votes:  { type: Number, default: 0 },
    created:   { type: Date, default: new Date() },
}); 

/* status types
1 - visible
2 - deleted
3 - removed
*/

module.exports = mongoose.model('Review', ReviewSchema);
