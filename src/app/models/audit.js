const mongoose = require('mongoose');

const AuditSchema = new mongoose.Schema({
    createdAt: { type: Date, default: new Date() },
    executor: String,
    target: { type: String, default: null },
    action: String,
    type: Number
});

module.exports = mongoose.model('Audit', AuditSchema);