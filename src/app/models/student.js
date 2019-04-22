const mongoose = require('mongoose');
const Image = require('./image');
const nanoid = require('../../bin/nanoid');

const StudentSchema = new mongoose.Schema({
    _id: { type: String, default: () => '0' + nanoid(9) },
    firstName: String,
    lastName: String,
    image: { type: String, ref: 'Image', default: null },
    account: { type: String, ref: 'Account' },
    schoolName: String,
});

/* account status:    account roles
0 - unverified        0 - Student
1 - verified          1 - Placeowner
3 - suspended         7 - Admin
4 - banned
5 - deleted
*/

StudentSchema.virtual('fullName').get(() => {
    return `${this.firstName} ${this.lastName}`;
});

StudentSchema.methods.updateProfileImage = function(file, callback) {

    // set the old image's status to deleted
    if (this.image) {
        Image.findByIdAndUpdate(this.image._id, { 'status': 0 }, (err, deleted) => { 
            if (err) { console.error(err); }
            console.log(`Deleted Image: ${deleted.filename}`);
        });
    }

    const image = new Image({
        filename: file.filename,
        url: `/profile/${this._id}/image`,
        contentType: file.mimetype
    });

    // save image to database
    image.save(err => {
        if (err) { return callback(err); }
        this.image = image._id; // set the student's image to the newly saved image
        this.save(err => callback(err)); // save changes to database
    });
}

module.exports = mongoose.model('Student', StudentSchema);
