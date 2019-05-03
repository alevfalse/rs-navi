const mongoose = require('mongoose');
const generate = require('../../bin/generator');

const AuditSchema = new mongoose.Schema({
    _id: { type: String, default: generate() },
    createdAt: { type: Date, default: new Date() },
    executor: { type: String, ref: 'User', required: true },
    action: { type: Number, required: true },
    actionType: { type: Number, default: 4 },
    target: {
        type: String,
        refPath: 'targetModel'
    },
    targetModel: {
        type: String,
        enum: ['User', 'Place', 'Review', 'Report']
    },
    reason: String,
    changed: String
});

/*
action types
0 - CREATE
1 - ACCESS
2 - UPDATE
3 - DELETE
4 - ALL

--- User Actions ---
0 - User Sign Up
1 - Verify Email
2 - Forgot Password
3 - Reset Password
4 - User Log In
5 - User Log Out
6 - User Update

11 - Place Add
12 - Place Update
13 - Place Delete
14 - Place Add Review

20 - Report User
21 - Report Place


--- Admin Actions ---
70 - Ban User
71 - Revoke User Ban
72 - Send Newsletter
77 - Accessed Logs
*/

module.exports = mongoose.model('Audit', AuditSchema);