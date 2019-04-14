const mongoose = require('mongoose');
const generate = require('nanoid/generate');
const alpha = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const PlaceSchema = new mongoose.Schema({
    _id: { type: String, default: () => generate(alpha, 10) },
    owner: { type: String, ref: 'Placeowner' },
    name: String,
    placeType: Number,
    status: { type: Number, default: 1 },
    created: { type: Date, default: new Date() },
    lastUpdated: { type: Date, default: null },
    address: {
        number: String,
        street: String,
        subdivision: String,
        barangay: String,
        city: String,
        zipCode: String,
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
0 - deleted     0: boarding house
1 - visible     1: dormitory
2 - removed     2: apartment
                3: condominium
                
*/

PlaceSchema.virtual('fullAddress').get(function() {
    const { number, street, subdivision, barangay, city, zipCode, province } = this.address;
    return `${number} ${street}, ${subdivision ? `${subdivision},` : ''} ` +
    `${barangay?`Bgy. ${barangay},`:''} ` +
    `${city}, ${zipCode?`${zipCode}`:''} ${province}`;
});

PlaceSchema.virtual('stars').get(function() {
    if (this.reviews.length == 0) { return 0 }
    
    let stars = 0;

    for (review of this.reviews) {
        stars += review.rating;
    }

    return stars / this.reviews.length;
});

PlaceSchema.methods.delete = function(callback) {
    this.status = 0;
    this.save(err => callback(err));
}

PlaceSchema.methods.removeImage = function(id, callback) {
    this.images.pull(id);
    this.save(err => callback(err));
}


module.exports = mongoose.model('Place', PlaceSchema);