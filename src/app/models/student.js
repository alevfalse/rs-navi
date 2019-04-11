const mongoose = require('mongoose');
const generate = require('nanoid/generate');
const alpha = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const StudentSchema = new mongoose.Schema({
    _id: { type: String, default: () => generate(alpha, 8) },
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
        lastLoggedIn: { type: Date, default: null },
        profileImage: { type: String, ref: 'Image' }
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