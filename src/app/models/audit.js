const mongoose = require('mongoose');
const generate = require('../../bin/generator');
const formatDate = require('../../bin/date-formatter');

const AuditSchema = new mongoose.Schema({
    _id: { type: String, default: () => generate() },
    createdAt: { type: Date, default: () => new Date() },
    executor: { type: String, ref: 'User', required: true, autopopulate: true },
    action: { type: Number, required: true },
    actionType: { type: Number, default: 4 },
    target: {
        type: String,
        refPath: 'targetModel',
        autopopulate: true
    },
    targetModel: {
        type: String,
        enum: ['User', 'Place', 'Review', 'Report']
    },
    reason: String,
    changed: {
        key: String,
        old: String,
        new: String
    },
    ip: { type: String, required: true }
});

AuditSchema.plugin(require('mongoose-autopopulate'));

AuditSchema.methods.toString = function() {

    let str;

    if (this.executor) {
        str = `<a href="/profile/${this.executor._id}" target="_blank">${this.executor.fullName}</a> `;
    } else {
        str = `<span class="gray">Unknown User</span> `;
    }

    // actions list at src/bin/auditor.js
    switch(this.action)
    {
    case 0: return str += 'signed up.';
    case 1: return str += 'verified their email address.';
    case 2: return str += 'submitted a forgot password form.';
    case 3: return str += 'reset their password.';
    case 4: return str += 'logged in.';
    case 5: return str += 'logged out.';

    case 6: return str += `updated their ${this.changed.key}`
        + `${this.changed.old ? ` from ${this.changed.old}` : ''}`
        + `${this.changed.new ? ` to ${this.changed.new}` : ''}.`;

    case 11: return str += `added the place <a href="/places/${this.target._id}" target="_blank">${this.target.name}</a>.`;
    case 12: return str += `updated the place <a href="/places/${this.target._id}" target="_blank">${this.target.name}</a>.`
        + `Changed <b>${this.changed.key}</b>${this.changed.old ? ` from ${this.changed.old} to ${this.changed.new}.` : '.'}`;
    case 13: return str += `deleted the place <a href="/places/${this.target._id}" target="_blank">${this.target.name}</a>${this.reason ? ` Reason: ${this.reason}` : '.'}`;
    case 14: return str += `submitted a review for <a href="/places/${this.target._id}" target="_blank">${this.target.name}</a>.`;
    case 15: return str += `deleted a review for <a href="/places/${this.target._id}" target="_blank">${this.target.name}</a>${this.reason ? ` Reason: ${this.reason}` : '.'}`;

    case 20: return str += `reported <a href="/profile/${this.target._id}" target="_blank">${this.target.name || this.target.fullName}</a>.`;

    case 70: return str += `banned <a href="/profile/${this.target._id}" target="_blank">${this.target.fullName}</a>. Reason: ${this.reason}`;
    case 71: return str += `revoked <a href="/profile/${this.target._id}" target="_blank">${this.target.name}</a>'s ban.`;
    case 72: return str += `verified <a href="/profile/${this.target._id}" target="_blank">${this.target.fullName}</a>'s license.`;
    case 73: return str += `rejected <a href="/profile/${this.target._id}" target="_blank">${this.target.name}</a>'s license.`;
    case 77: return str += `fetched access logs.`;
    case 78: return str += `fetched audit logs.`;

    default: return str += 'did an unknown action. Fix your code, noob.';
    }
}

// actions and action types at src/bin/auditor.js

module.exports = mongoose.model('Audit', AuditSchema);