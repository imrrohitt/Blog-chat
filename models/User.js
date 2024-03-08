const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
    prompt: String,
    answer: String,
    timestamp: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    searchHistory: [interactionSchema],
});

const User = mongoose.model('User', userSchema);

module.exports = User;