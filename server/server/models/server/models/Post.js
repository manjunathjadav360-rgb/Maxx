const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mediaUrl: { type: String, required: true },
    caption: { type: String, default: '' },
    mediaType: { type: String, enum: ['image', 'reel'], required: true },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);

