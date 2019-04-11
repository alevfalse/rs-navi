const mongoose = require('mongoose');
const generate = require('nanoid/generate');
const alpha = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const AdminSchema = new mongoose.Schema({
    _id: { type: String, default: () => generate(alpha, 8) },
    firstName: String,
    lastName: String,
    account: {
        email: String,
        password: String,
        passcode: Number,
        role: {
            type: Number,
            default: 7
        },
        created: {
            type: Date,
            default: new Date()
        },
        lastLoggedIn: {
            type: Date,
            default: null
        }
    }
})

/*account roles
0 - Student
1 - Placeowner
7 - Admin
*/

function generateHex() {
    return crypto.randomBytes(4).toString('hex');
}


module.exports = mongoose.model('Admin', AdminSchema);