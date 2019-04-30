const mongoose = require('mongoose');
const nanoid = require('../../bin/nanoid');
const formatDate = require('../../bin/date-formatter');

const ReviewSchema = new mongoose.Schema({
    _id: { type: String, default: () => nanoid(10) },
    place: { type: String, ref: 'Place' },
    author: { type: String, ref: 'Student' },
    comment: String,
    edited: { type: Boolean, default: false },
    status: { type: Number, default: 1 },
    createdAt:   { type: Date, default: new Date() },
}); 

ReviewSchema.virtual('dateString').get(function() {
    return formatDate(this.created);
});

module.exports = mongoose.model('Review', ReviewSchema);
