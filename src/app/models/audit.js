const mongoose = require('mongoose');

const AuditSchema = new mongoose.Schema({
    executor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    target: mongoose.Schema.Types.ObjectId,
    action: Number,
    date: {
        type: Date,
        default: new Date()
    }
})

/* action:
0 - verify
1 - update
3 - delete
4 - ban
*/

module.exports = mongoose.model('Audit', AuditSchema);