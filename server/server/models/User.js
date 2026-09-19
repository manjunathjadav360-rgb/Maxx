const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    profilePic: { type: String, required: true },
    bio: { type: String, default: '' },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

