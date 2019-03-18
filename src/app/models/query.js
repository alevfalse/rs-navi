const mongoose = require('mongoose');

const QuerySchema = new mongoose.Schema({
    keyword: String,
    date: { type: Date, default: new Date() }
})

module.exports = mongoose.model('Query', QuerySchema);