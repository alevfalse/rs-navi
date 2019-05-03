const mongoose = require('mongoose');
const generate = require('../../bin/generator');
const logger = require('../../config/logger');
const audit = require('../../bin/auditor');
const formatDate = require('../../bin/date-formatter');

const Image = require('./image');

const PlaceSchema = new mongoose.Schema({
    _id: { type: String, default: generate()},
    status: { type: Number, default: 1 },
    createdAt: { type: Date, default: new Date() },
    updated: { type: Date, default: null },
    owner: { type: String, ref: 'User', required: true },
    name: { type: String, required: true },
    placeType: { type: Number, required: true },
    address: {
        number: { type: String, required: true },
        street: { type: String, required: true },
        subdivision: { type: String, default: null },
        barangay: { type: String, default: null },
        city: { type: String, required: true },
        zipCode: { type: String, default: null },
        province: { type: String, required: true },
    },
    price: { type: Number, required: true },
    listType: { type: Number, required: true },
    description: { type: String, required: true },
    coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    floors: { type: Number, default: null },
    bedrooms: { type: Number, default: null },
    bathrooms: { type: Number, default: null },
    area: { type: Number, default: null },
    images: [{ type: String, ref: 'Image', required: true}]
})

PlaceSchema.index({ owner: 1 });

PlaceSchema.on('index', (err) => {
    logger.info(err);
});

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

function createImage(file) {
    return new Promise((resolve, reject) => {
        const image = new Image({
            filename: file.filename,
            url: `/places/${this._id}/images/` + file.filename,
            contentType: file.mimetype
        });

        image.save(err => {
            if (err) { return reject(err); }
            resolve(image._id);
        });
    })
}

PlaceSchema.addImages = function(files, callback) {

    const oldImages = this.images;

    const promises = [];
    
    for (file of files) {
        promises.push(createImage(file));
    }
    
    Promise.all(promises).then(function(images) {
        console.log(images);
        this.images = this.images.concat(images);
        this.save(err => {
            callback(err);
            if (!err) { audit(this.owner._id || this.owner, 12, 2, { target: this._id, targetModel: 1, 
                changed: { key: 'images', old: oldImages, new: this.images } }); 
            }
        })
    }).catch(logger.error);
}

PlaceSchema.methods.removeImage = function(id, callback) {
    const oldImages = this.images;

    this.images.pull(id);
    this.save(err => {
        callback(err);
        if (!err) { audit(this.owner._id || this.owner, 12, 2, { target: this._id, targetModel: 1,
            changed: { key: 'images', old: oldImages, new: this.images } }); 
        }
    })
}

PlaceSchema.methods.delete = function(callback) {
    this.status = 0;
    this.save(err => {
        callback(err);
        if (!err) { audit(this.owner._id || this.owner, 13, 3, { target: this._id, targetModel: 1,
            changed: { key: 'status', old: 1, new: 0 } }); 
        }
    })
}


module.exports = mongoose.model('Place', PlaceSchema);
