const mongoose = require('mongoose');

const PlaceSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Placeowner' },
    name: String,
    type: Number,
    status: { type: Number, default: 0 },
    address: {
        lotNumber: String,
        streetName: String,
        subdivision: String,
        barangay: String,
        city: String,
        province: String,
        zipCode: String
    },
    description: String,
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }]
})

/* status:      /* types:
0 - good        0: boarding house
1 - bad         1: dormitory
2 - deleted     2: apartment
                3: condominium
*/          

module.exports = mongoose.model('Place', PlaceSchema);