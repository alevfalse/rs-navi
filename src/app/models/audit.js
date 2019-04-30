const mongoose = require('mongoose');

const AuditSchema = new mongoose.Schema({
    createdAt: { type: Date, default: new Date() },
    executor: String,
    target: { type: String, default: null },
    reason: { type: String, default: null },
    changes: {
        key: String,
        old: String,
        new: String
    },
    action: Number,
    actionType: { type: String, default: 'ALL' }
});

/*
action types
CREATE
DELETE
UPDATE
ACCESSED
ALL

action
0 - Account Sign Up
1 - Verified Account
2 - Forgot Account Password
3 - Reset Account Password
4 - Account Log In
5 - Account Log Out
6 - Account Update

11 - Place Add
12 - Place Update
13 - Place Delete
14 - Place Add Review

20 - Report

30 - Newsletter Subscribe 
31 - Newsletter Unsubscribe
32 - Newsletter Send

70 - Account Ban
71 - Account Revoke Ban
72 - Accessed Logs
*/

module.exports = mongoose.model('Audit', AuditSchema);