const mongoose = require('mongoose');

// model for emails subscribed in our mailing list
const SubscriberSchema = new mongoose.Schema({
    email: String,
    date: { type: Date, default: new Date() },
    status: { type: Number, default: 1 }
});

/*
status values:
0 - unsubscribed
1 - subsribed
2 - removed
*/

module.exports = mongoose.model('Subscriber', SubscriberSchema);