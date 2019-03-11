const mongoose = require('mongoose');

const PlaceownerSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    firstName: String,
    lastName: String,
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    prcLicense: { type: mongoose.Schema.Types.ObjectId, ref: 'PRCLicense'}
})

module.exports = mongoose.model('Placeowner', PlaceownerSchema);