const mongoose = require('mongoose');
const generate = require('../../bin/generator');

const ReportSchema = new mongoose.Schema({
    _id: { type: String, default: () => generate() },
    createdAt: { type: Date, default: () => new Date() },
    status: { type: Number, default: 0 },
    author: { type: String, ref: 'User', required: true, autopopulate: true },
    target: { type: String, ref: 'Place', required: true, autopopulate: true },
    type: { type: Number,  required: true },
    comment: { type: String, required: true }
});

ReportSchema.plugin(require('mongoose-autopopulate'));

/*
report type for place
0 - Not available
1 - Placeowner not responding
2 - Incorrect information
3 - Duplicate listing
4 - Fake or spam
5 - Other

status
0 - unresolved
1 - resolved
*/

module.exports = mongoose.model('Report', ReportSchema);