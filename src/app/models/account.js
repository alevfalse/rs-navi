const mongoose = require('mongoose');
const argon = require('argon2');

const AccountSchema = new mongoose.Schema({
    _id: String,
    role: Number,
    email: String,
    password: String,
    hashCode: String,
    status:   { type: Number, default: 0 },
    createdAt:  { type: Date, default: new Date() },
    lastLoggedIn: { type: Date, default: null }
});

// virtual getters
AccountSchema.virtual('roleString').get(function() {
    return this.role === 0 ? 'Student' : 'Placeowner'
});

AccountSchema.virtual('statusString').get(function() {
    switch(this.status)
    {
        case 0: return 'Unverified';
        case 1: return 'Verified';
        case 2: return 'Suspended';
        case 3: return 'Banned';
        default: return 'Unknown';
    }
});

AccountSchema.methods.login = function(callback) {
    this.hashCode = null;
    this.lastLoggedIn = new Date();
    this.save(err => callback(err));
}

AccountSchema.methods.verifyPassword = async function(password) {
    if (!password || password.length < 8) { return false; }
    return await argon.verify(this.password, password);
}

AccountSchema.methods.verifyEmail = function(callback) {
    this.hashCode = null;
    this.status = 1;
    this.lastLoggedIn = new Date();
    this.save(err => callback(err));
}

AccountSchema.methods.updatePassword = async function(password, callback) {
    this.password = await argon.hash(password, { timeCost: 50 });
    this.hashCode = null;
    this.save(err => callback(err));
}


module.exports = mongoose.model('Account', AccountSchema);