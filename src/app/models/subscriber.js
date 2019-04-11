const mongoose = require('mongoose');
const generate = require('nanoid/generate');
const alpha = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// model for emails subscribed in our mailing list
const SubscriberSchema = new mongoose.Schema({
    _id: { type: String, default: () => generate(alpha, 8) },
    email: String,
    created: { type: Date, default: new Date() },
    status: { type: Number, default: 1 }
});

/*
status values:
0 - unsubscribed
1 - subsribed
2 - removed
*/

module.exports = mongoose.model('Subscriber', SubscriberSchema);