const mongoose = require('mongoose');

const GlobalCounterSchema = new mongoose.Schema({
    model: {
        type: String,
        required: true,
        unique: true
    },
    count: {
        type: Number,
        required: true,
        default: 0
    }
});

module.exports = mongoose.model('GlobalCounter', GlobalCounterSchema);