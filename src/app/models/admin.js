const mongoose = require('mongoose');
const nanoid = require('../../bin/nanoid');

const AdminSchema = new mongoose.Schema({
    _id: { type: String, default: () => '7' + nanoid(9) },
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
