const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    rating: Number,
    comment: String,
    votes:  { type: Number, default: 0 },
    date:   { type: Date, default: new Date() },
    edited: { type: Boolean, default: false }
});         

module.exports = mongoose.model('Review', ReviewSchema);