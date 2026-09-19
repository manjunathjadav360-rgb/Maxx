const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Post = require('./models/Post');
const User = require('./models/User');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/insta_clone';

mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB connected for Instagram Clone API."))
    .catch(err => console.error("Database error:", err));

// Paginated Post Feed Endpoint
app.get('/api/posts', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const posts = await Post.find({ mediaType: 'image' })
            .populate('user', 'username profilePic')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Paginated Reels Feed Endpoint (Vertical Video Streaming)
app.get('/api/reels', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const reels = await Post.find({ mediaType: 'reel' })
            .populate('user', 'username profilePic')
            .skip((page - 1) * limit)
            .limit(limit);
        res.json(reels);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Instagram Backend running on port ${PORT}`);
});

