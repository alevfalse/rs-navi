const mongoose = require('mongoose');

const PlaceSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Placeowner' },
    name: String,
    placeType: Number,
    status: { type: Number, default: 0 },
    added: { type: Date, default: new Date() },
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
    coordinates: [Number],
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }]
})

/* status:      /* types:
0 - good        0: boarding house
1 - bad         1: dormitory
2 - deleted     2: apartment
                3: condominium
*/          

module.exports = mongoose.model('Place', PlaceSchema);