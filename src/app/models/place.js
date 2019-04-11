const mongoose = require('mongoose');
const generate = require('nanoid/generate');
const alpha = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const PlaceSchema = new mongoose.Schema({
    _id: { type: String, default: () => generate(alpha, 8) },
    owner: { type: String, ref: 'Placeowner' },
    name: String,
    placeType: Number,
    status: { type: Number, default: 0 },
    created: { type: Date, default: new Date() },
    lastUpdated: { type: Date, default: null },
    address: {
        number: String,
        street: String,
        subdivision: String,
        barangay: String,
        city: String,
        zipCode: Number,
        province: String
    },
    price: Number,
    listType: Number,
    description: String,
    coordinates: {
        lat: Number,
        lng: Number
    },
    images: [{ type: String, ref: 'Image' }],
    reviews: [{ type: String, ref: 'Review' }]
})

/* status:      /* types:
0 - good        0: boarding house
1 - bad         1: dormitory
2 - deleted     2: apartment
                3: condominium
*/          

module.exports = mongoose.model('Place', PlaceSchema);