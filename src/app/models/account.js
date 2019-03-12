const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    role: Number,
    email: String,
    password: String,
    verified: Boolean,
    hashCode: String
})

module.exports = mongoose.model('Account', AccountSchema);