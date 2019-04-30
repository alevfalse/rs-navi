const mongoose = require('mongoose');
const nanoid = require('../../bin/nanoid');
const formatDate = require('../../bin/date-formatter');

const Placeowner = require('./placeowner');
const Image = require('./image');
const Review = require('./review');

const PlaceSchema = new mongoose.Schema({
    _id: { type: String, default: () => nanoid(10) },
    owner: { type: String, ref: 'Placeowner' },
    name: String,
    placeType: Number,
    status: { type: Number, default: 1 },
    createdAt: { type: Date, default: new Date() },
    updated: { type: Date, default: null },
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
    floors: { type: Number, default: null },
    bedrooms: { type: Number, default: null },
    bathrooms: { type: Number, default: null },
    area: Number,
    images: [{ type: String, ref: 'Image' }],
    reviews: [{ type: String, ref: 'Review' }], // TODO: Remove
    reports: [{ type: String, ref: 'Report' }]  // TODO: Remove? or set limit
})

/* status:      /* types:
0 - deleted     0: boarding house
1 - visible     1: dormitory
2 - removed     2: apartment
                3: condominium

0 - Rent/Sell
1 - Rent
2 - Sell        
*/

PlaceSchema.virtual('fullAddress').get(function() {
    const { number, street, subdivision, barangay, city, zipCode, province } = this.address;
    return `${number} ${street}, ${subdivision ? `${subdivision},` : ''} ` +
    `${barangay?`Bgy. ${barangay},`:''} ` +
    `${city}, ${zipCode?`${zipCode}`:''} ${province}`;
});

PlaceSchema.virtual('placeTypeString').get(function() {
    switch(this.placeType)
    {
        case 0: return 'Boarding House';
        case 1: return 'Dormitory';
        case 2: return 'Apartment';
        case 3: return 'Condominium';
        default: return 'Unknown Place Type';
    }
});

PlaceSchema.virtual('listTypeString').get(function() {
    switch(this.listType)
    {
        case 0: return 'Rent/Sale';
        case 1: return 'Rent';
        case 2: return 'Sale';
        default: return 'Unknown List Type';
    }
});

PlaceSchema.virtual('createdAtString').get(function() {
    return formatDate(this.createdAt);
});

PlaceSchema.virtual('updatedString').get(function() {
    return formatDate(this.updated);
});

PlaceSchema.virtual('stars').get(function() {
    if (this.reviews.length == 0) { return 0 }
    
    let stars = 0;

    for (review of this.reviews) {
        stars += review.rating;
    }

    return (stars / this.reviews.length).toFixed(1);
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
