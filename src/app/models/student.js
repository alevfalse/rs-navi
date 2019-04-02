const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    schoolName: String,
    account: { 
        email: String,
        password: String,
        hashCode: { type: String, default: null },
        status:   { type: Number, default: 0 },
        role:     { type: Number, default: 0 },
        created:  { type: Date, default: new Date() },
        lastLoggedIn: { type: Date, default: null }
    }
})
/* account status:    account roles
0 - unverified        0 - Student
1 - verified          1 - Placeowner
3 - suspended         7 - Admin
4 - banned
5 - deleted
*/

module.exports = mongoose.model('Student', StudentSchema);