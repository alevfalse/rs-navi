const mongoose = require('mongoose');
const generate = require('nanoid/generate');
const alpha = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const ReviewSchema = new mongoose.Schema({
    _id: { type: String, default: () => generate(alpha, 8) },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    rating: Number,
    comment: String,
    votes:  { type: Number, default: 0 },
    created:   { type: Date, default: new Date() },
    edited: { type: Boolean, default: false }
}); 

module.exports = mongoose.model('Review', ReviewSchema);