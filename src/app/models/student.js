const mongoose = require('mongoose');
const generate = require('nanoid/generate');
const alpha = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const StudentSchema = new mongoose.Schema({
    _id: { type: String, default: () => '0' + generate(alpha, 9) },
    firstName: String,
    lastName: String,
    schoolName: String,
    image: { type: String, ref: 'Image', default: null },
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

StudentSchema.methods.verifyEmail = function(callback) {
    this.account.hashCode = null;
    this.account.status = 1;
    this.account.lastLoggedIn = new Date();

    // Update student in the database
    this.save((err) => {
        if (err) { return callback(err); } // status 500

        // Authenticate the student and bind it to request as req.user
        req.login(this, (err) => {
            if (err) { return callback(err); } // status 500

            req.flash('message', 'Email address verified.')
            req.session.save((err) => callback(err));
        });
    });
}

StudentSchema.methods.updateProfileImage = function(file, callback) {
    // set old image's status to deleted
    Image.findByIdAndUpdate(this.image._id, { 'status': 0 }, function(err, deleted) {
        if (err) { return callback(err); }

        // create new image document
        const image = new Image({
            filename: file.filename,
            url: `/profile/${this._id}/image`,
            contentType: file.mimetype
        });

        // save image to database
        image.save((err) => {
            if (err) { return callback(err); }

            // set  this's image to the newly saved image
            this.image = image._id;

            // save changes to  this to database
            this.save((err) => callback(err));
        });
    });
}

module.exports = mongoose.model('Student', StudentSchema);
