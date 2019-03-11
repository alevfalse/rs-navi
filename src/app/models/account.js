const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    role: String,
    email: String,
    password: String,
    verified: Boolean
})

module.exports = mongoose.model('Account', AccountSchema);