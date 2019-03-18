const mongoose = require('mongoose');

const PlaceSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Placeowner' },
    reviews: [ { type: mongoose.Schema.Types.ObjectId, ref: 'Review'} ],
    status: { type: Number, default: 0 }
})
/* status:
0 - good
1 - flagged
3 - deleted
*/

module.exports = mongoose.model('Place', PlaceSchema);