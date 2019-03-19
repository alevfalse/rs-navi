const mongoose = require('mongoose');

const PlaceownerSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    account: { 
        email: String,
        password: String,
        hashCode: { type: String, default: null },
        status:   { type: Number, default: 0 },
        role:     { type: Number, default: 0 },
        created:  { type: Date, default: new Date() },
        lastLoggedIn: { type: Date, default: new Date() }
    },
    license: {
        status: { type: Number, default: 0 },
        type:   { type: Number, default: null },
    },
    subscription: {
        status: { type: Number, default: 0 },
        expiration: { type: Date, defualt: null }
    }
})

/* account status:       license type:                    subscription status:
0 - unverified            0 - Real Estate Appraiser       0 - unsubscribed
1 - verified              1 - Real Estate Broker          1 - subscribed
2 - suspended             2 - Real Estate Accountant      2 - expired
3 - banned              
4 - deleted              license status:                
5 - subscribed            0 - none
                          1 - unverified
                          2 - verified
                          3 - revoked
*/

module.exports = mongoose.model('Placeowner', PlaceownerSchema);