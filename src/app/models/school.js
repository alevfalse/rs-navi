const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    acronym: String,
    address: {
        street: String,
        city: String,
        province: String,
        zip: Number
    }
})

module.exports = mongoose.model('School', SchoolSchema);