const mongoose = require('mongoose');
const nanoid = require('../../bin/nanoid');

const Place = require('./place');

const ReportSchema = new mongoose.Schema({
    _id: { type: String, default: () => nanoid() },
    createdAt: { type: Date, default: new Date() },
    place: { type: String, ref: 'Place' },
    author: String,
    reason: String,
    status: { type: Number, default: 0 }
});

/**
status
0 - unread
1 - read but unresolved
2 - resolved
*/

module.exports = mongoose.model('Report', ReportSchema);