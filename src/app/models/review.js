const mongoose = require('mongoose');
const generate = require('../../bin/generator');
const formatDate = require('../../bin/date-formatter');

const ReviewSchema = new mongoose.Schema({
    _id: { type: String, default: generate() },
    place: { type: String, ref: 'Place', required: true },
    author: { type: String, ref: 'Student', required: true },
    comment: { type: String, required: true },
    edited: { type: Boolean, default: false },
    status: { type: Number, default: 1 },
    createdAt:   { type: Date, default: new Date() },
}); 

ReviewSchema.virtual('dateString').get(function() {
    return formatDate(this.createdAt);
});

module.exports = mongoose.model('Review', ReviewSchema);
