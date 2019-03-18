const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    status: { type: Number, default: 0 },
    rating: Number,
    comment: String,
    flags: [
        {
            type: Number,
            comment: String
        }
    ]
})

/*status:       flags type:
0 - good        0 - Irrelevant
1 - flagged     1 - Hate Speech
2 - deleted     2 - Spam
                3 - Fake
*/      

module.exports = mongoose.model('Review', ReviewSchema);