const mongoose = require('mongoose');
const Image = require('./image');
const nanoid = require('../../bin/nanoid');

const PlaceownerSchema = new mongoose.Schema({
    _id: { type: String, default: () => '1' + nanoid(9) },
    firstName: String,
    lastName: String,
    image: { type: String, ref: 'Image', default: null },
    account: { type: String, ref: 'Account' },
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

PlaceownerSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

PlaceownerSchema.methods.updateProfileImage = function(file, callback) {

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
        this.image = image._id; // set the placeowner's image to the newly saved image
        this.save(err => callback(err)); // save changes to database
    });
}

module.exports = mongoose.model('Placeowner', PlaceownerSchema);
