const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    firstName: String,
    lastName: String,
    schoolName: String,
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }
})

module.exports = mongoose.model('Student', StudentSchema);