const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    schoolName: String,
    account: { 
        username: String,
        password: String,
        hashCode: String,
        status: Number,
        role: { type: Number, default: 0 },
        created: { type: Date, default: new Date() },
        lastLoggedIn: Date
    }
})
/* account status:
0 - unverified
1 - verified
3 - suspended
4 - banned
5 - deleted
*/

module.exports = mongoose.model('Student', StudentSchema);