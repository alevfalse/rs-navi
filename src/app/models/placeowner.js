const mongoose = require('mongoose');
const generate = require('nanoid/generate');
const alpha = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const Image = require('./image');

const PlaceownerSchema = new mongoose.Schema({
    _id: { type: String, default: () => '1' + generate(alpha, 9) },
    firstName: String,
    lastName: String,
    image: { type: String, ref: 'Image', default: null },
    account: { 
        email: String,
        password: String,
        hashCode: { type: String, default: null },
        status:   { type: Number, default: 0 },
        role:     { type: Number, default: 1 },
        created:  { type: Date, default: new Date() },
        lastLoggedIn: { type: Date, default: null },
    },
    license: {
        status: { type: Number, default: 0 },
        type:   { type: Number, default: null },
    }
});

/* 
account status:         license type:                    
0 - unverified          0 - Real Estate Appraiser       
1 - verified            1 - Real Estate Broker          
2 - suspended           2 - Real Estate Accountant      
3 - banned               
4 - deleted             subscription status:              
5 - subscribed          0 - unsubscribed
                        1 - subscribed
license status:         2 - expired
0 - none                3 - cancelled
1 - unverified
2 - verified
3 - revoked
*/

PlaceownerSchema.methods.updateProfileImage = function(file, callback) {

    if (this.image) {
        Image.findByIdAndUpdate(this.image._id, { 'status': 0 },
        (err, deleted) => {
            if (err) { console.error(err); }
        });
    }

    const image = new Image({
        filename: file.filename,
        url: `/profile/${this._id}/image`,
        contentType: file.mimetype
    });

    // save image to database
    image.save((err) => {
        if (err) { return callback(err); }
        this.image = image._id; // set the placeowner's image to the newly saved image
        this.save((err) => callback(err)); // save changes to database
    });
}

module.exports = mongoose.model('Placeowner', PlaceownerSchema);
