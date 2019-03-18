const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
    name: String,
    acronym: String,
    address: {
        street: String,
        city: String,
        province: String,
        zip: Number
    },
    status: { type: Number, default: 0 } 
})

/* status:
0 - unverified
1 - verified
2 - deleted
*/

module.exports = mongoose.model('School', SchoolSchema);