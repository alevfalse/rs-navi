const mongoose = require('mongoose');
const generate = require('nanoid/generate');
const alpha = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const AdminSchema = new mongoose.Schema({
    _id: { type: String, default: () => '7' + generate(alpha, 9) },
    firstName: String,
    lastName: String,
    account: { type: String, ref: 'Account' }
})

/*account roles
0 - Student
1 - Placeowner
7 - Admin
*/

module.exports = mongoose.model('Admin', AdminSchema);
