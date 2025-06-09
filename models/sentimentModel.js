const mongoose = require('mongoose');

const sentimentSchema = new mongoose.Schema({
    Statement: {
        type: String,
        required: true
    },
    sentiment: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Sentiment', sentimentSchema);