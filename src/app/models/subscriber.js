const mongoose = require('mongoose');
const nanoid = require('../../bin/nanoid');

// model for emails subscribed in our mailing list
const SubscriberSchema = new mongoose.Schema({
    _id: { type: String, default: () => nanoid(10) },
    email: String,
    createdAt: { type: Date, default: new Date() },
    status: { type: Number, default: 1 }
});

/*
status values:
0 - unsubscribed
1 - subsribed
2 - removed
*/

module.exports = mongoose.model('Subscriber', SubscriberSchema);
