const mongoose = require('mongoose');
const generate = require('../../bin/generator');

const ReportSchema = new mongoose.Schema({
    _id: { type: String, default: generate() },
    createdAt: { type: Date, default: new Date() },
    status: { type: Number, default: 0 },
    type: { type: Number, required: true },
    author: { type: String, ref: 'User', required: true },
    reason: { type: String, required: true },
    target: { 
        type: String, // id of target place/user/review
        refPath: 'targetModel',
        required: true
    },
    targetModel: {
        type: String,
        enum: ['User', 'Place', 'Review'],
        required: true
    }
});

/**
status
0 - unresolve
1 - resolved
*/

module.exports = mongoose.model('Report', ReportSchema);