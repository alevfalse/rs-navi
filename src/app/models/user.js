const mongoose = require('mongoose');
const generate = require('../../bin/generator');
const audit = require('../../bin/auditor');
const logger = require('../../config/logger');
const Image = require('./image');


const UserSchema = new mongoose.Schema({
    _id: { type: String, default: generate() },
    createdAt:  { type: Date, default: new Date() },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    image: { type: String, ref: 'Image', default: null },
    account: { 
        role: { type: Number, required: true },
        email: { type: String, required: true, index: true },
        password: { type: String, required: true },
        hashCode: { type: String, default: generate() },
        lastLoggedIn: { type: Date, default: null },
        status:   { type: Number, default: 0, required: true },
        unlockedAt: { type: Date, default: null }
    },
    contactNumber: { type: String, required: true },

    // optional fields depending on role
    schoolName: String,
    license: {
        status: { type: Number },
        type: { type: Number }
    }
});

/* 
account status:
0 - unverified
1 - verified
2 - locked
3 - deleted
4 - banned

license status:
0 - no license
1 - unverified
2 - verified
3 - revoked

license type:
0 - Real Estate Appraiser
1 - Real Estate Broker
2 - Real Estate Accountant
*/

// ==================================================================
// Virtual Getters ==================================================

UserSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

UserSchema.virtual('partialContactNumber').get(function() {
    let str = this.contactNumber.substr(0, 3);
    for (let i=0; i<this.contactNumber.length; i++) {
        str += '*';
    }
    return str;
});

// virtual getters
UserSchema.virtual('roleString').get(function() {
    return this.account.role === 0 ? 'Student' : this.account.role === 1 ? 'Placeowner' : 'Admin';
});

UserSchema.virtual('statusString').get(function() {
    switch(this.status)
    {
        case 0: return  'Unverified';
        case 1: return  'Verified';
        case 2: return  'Suspended';
        case 3: return  'Banned';
        default: return 'Unknown';
    }
});

// ==================================================================
// User Schema Methods ==============================================

UserSchema.methods.login = function(callback) {
    this.account.hashCode = null;
    this.account.lastLoggedIn = new Date();
    this.save(err => {
        callback(err);
        if (!err) { audit(this._id, 4, 1) }
    });
}

UserSchema.methods.verifyPassword = async function(password) {
    if (!password || password.length < 8) { return false; }
    return await argon.verify(this.account.password, password);
}

UserSchema.methods.verifyEmail = function(callback) {
    this.account.hashCode = null;
    this.account.status = 1;
    this.account.lastLoggedIn = new Date();
    this.save(err => {
        callback(err);
        if (!err) { audit(this._id, 1, 2, { changed: { key: 'status', old: 0, new: 1 } }); }
    });
}

UserSchema.methods.updatePassword = async function(password, callback, reset=false) {
    
    this.account.password = await argon.hash(password, { timeCost: 50 });
    this.account.hashCode = null;
    this.save(err => {
        callback(err);
        if (!err) { audit(this._id, reset ? 3 : 6, 2, { changed: { key: 'password' } }); }
    });
}

UserSchema.methods.updateImage = function(file, callback) {

    let oldImageFilename = null;

    // set the old image's status to deleted
    if (this.image) { 
        this.image.delete(err => { 
            if (err) { logger.error(err); } 
        });
        oldImageFilename = this.image.filename;
    }

    const newImage = new Image({
        filename: file.filename,
        url: `/profile/${this._id}/image`,
        contentType: file.mimetype
    });

    newImage.save(err => {
        if (err) { return callback(err); }

        this.image = newImage._id;
        this.save(err => {
            callback(err);
            if (!err) { audit(this._id, 6, 2, { changed: { key: 'image', old: oldImageFilename, new: newImage.filename } }); }
        });
    });
}

UserSchema.methods.removeImage = function(callback) {
    if (!this.image) { return callback(null); }

    const oldImageFilename = this.image.filename;

    this.image.delete(err => { // Image Schema's method
        if (err) { return callback(err); }
        this.image = null;
        this.save(err => {
            callback(err);
            if (!err) { audit(this._id, 6, 3, { changed: { key: 'image', old: oldImageFilename, new: null } }); }
        });
    });
}

module.exports = mongoose.model('User', UserSchema);
