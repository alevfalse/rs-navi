const mongoose = require('mongoose');

const PlaceSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Placeowner' },
    reviews: [
        {
            author: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
            rating: Number,
            comment: String,
            status: { type: Number, default: 0 },
            votes:  { type: Number, default: 0 },
            date:   { type: Date, default: new Date() },
            edited: { type: Boolean, default: false }
        }
    ],
    status: { type: Number, default: 0 }
})

/* status:
0 - good
1 - bad
2 - deleted
*/

module.exports = mongoose.model('Place', PlaceSchema);