const mongoose = require('mongoose');
const argon = require('argon2');
const generate = require('../../bin/generator');
const logger = require('../../config/logger');
const formatDate = require('../../bin/date-formatter');
const Image = require('./image');

const UserSchema = new mongoose.Schema({
    _id: { type: String, default: () => generate() },
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
    partner: { type: Boolean, default: false },

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
0 - None
1 - Real Estate Appraiser
2 - Real Estate Broker
3 - Real Estate Accountant
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

UserSchema.virtual('roleString').get(function() {
    return this.account.role === 0 ? 'Student' : this.account.role === 1 ? 'Placeowner' : 'Admin';
});

UserSchema.virtual('statusString').get(function() {
    switch(this.account.status)
    {
        case 0: return  'Unverified';
        case 1: return  'Verified';
        case 2: return  'Suspended';
        case 3: return  'Banned';
        default: return 'Unknown';
    }
});

UserSchema.virtual('licenseStatusString').get(function() {
    switch(this.license.status)
    {
        case 0: return  'No License';
        case 1: return  'Unverified';
        case 2: return  'Verified';
        case 3: return  'Revoked';
        default: return 'Unknown';
    }
});

UserSchema.virtual('licenseTypeString').get(function() {
    switch(this.license.type)
    {
        case 0: return  'No License';
        case 1: return  'Real Estate Appraiser';
        case 2: return  'Real Estate Broker';
        case 3: return  'Real Estate Accountant';
        default: return 'Unknown';
    }
});

UserSchema.virtual('unlockedAtString').get(function() {
    return formatDate(this.unlockedAt);
});

// Virtual Population
UserSchema.virtual('places', {
    ref: 'Place',
    localField: '_id',
    foreignField: 'owner',
    options: {
        match: { 'status': 1 }
    }
});

// Virtual Population
UserSchema.virtual('reports', {
    ref: 'Report',
    localField: '_id',
    foreignField: 'target'
});

// ==================================================================
// User Schema Methods ==============================================

UserSchema.methods.login = function(callback) {
    this.account.hashCode = null;
    this.account.lastLoggedIn = new Date();
    this.save(callback);
}

UserSchema.methods.verifyPassword = async function(password) {
    if (!password || password.length < 8) { return false; }
    return await argon.verify(this.account.password, password);
}

UserSchema.methods.verifyEmail = function(callback) {
    this.account.hashCode = null;
    this.account.status = 1;
    this.account.lastLoggedIn = new Date();
    this.save(callback);
}

UserSchema.methods.updatePassword = async function(password, callback, reset=false) {
    
    this.account.password = await argon.hash(password, { timeCost: 50 });
    this.account.hashCode = null;
    this.save(callback);
}

UserSchema.methods.updateImage = function(file, callback) {

    // set the old image's status to deleted
    if (this.image) { 
        this.image.delete(err => { if (err) { logger.error(err.stack); } });
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
        this.save(callback);
    });
}

UserSchema.methods.removeImage = function(callback) {
    if (!this.image) { return callback(null); }

    this.image.delete(err => { // Image Schema's method
        if (err) { return callback(err); }
        this.image = null;
        this.save(callback);
    });
}

module.exports = mongoose.model('User', UserSchema);
