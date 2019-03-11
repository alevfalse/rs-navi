const mongoose = require('mongoose');

const PRCLicenseSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    type: String,
    licenseNumber: String,
    birthday: Date,
    verified: Boolean
})

module.exports = mongoose.model('PRCLicense', PRCLicenseSchema);