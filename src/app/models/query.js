const mongoose = require('mongoose');

const QuerySchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    keyword: String,
    date: Date
})

module.exports = mongoose.model('Query', QuerySchema);