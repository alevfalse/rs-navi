const mongoose = require('mongoose');
const generate = require('nanoid/generate');
const alpha = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const PlaceownerSchema = new mongoose.Schema({
    _id: { type: String, default: () => generate(alpha, 8) },
    firstName: String,
    lastName: String,
    account: { 
        email: String,
        password: String,
        hashCode: { type: String, default: null },
        status:   { type: Number, default: 0 },
        role:     { type: Number, default: 1 },
        created:  { type: Date, default: new Date() },
        lastLoggedIn: { type: Date, default: null },
        profileImage: { type: String, ref: 'Image' }
    },
    license: {
        status: { type: Number, default: 0 },
        type:   { type: Number, default: null },
    }
})

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

module.exports = mongoose.model('Placeowner', PlaceownerSchema);