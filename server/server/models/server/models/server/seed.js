const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/insta_clone';

const sampleReels = [
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4"
];

const sampleImages = [
    "https://picsum.photos/seed/post1/600/600",
    "https://picsum.photos/seed/post2/600/600",
    "https://picsum.photos/seed/post3/600/600",
    "https://picsum.photos/seed/post4/600/600"
];

async function seedDatabase() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB for seeding...");

        await Post.deleteMany({});
        await User.deleteMany({});
        console.log("Cleared old database records.");

        console.log("Generating 500 creator profiles...");
        let users = [];
        for (let i = 1; i <= 500; i++) {
            users.push({
                username: `creator_${i}`,
                fullName: `User Creator ${i}`,
                profilePic: `https://i.pravatar.cc/150?img=${i % 70}`,
                bio: `Official creator profile #${i}`,
                followersCount: Math.floor(Math.random() * 15000),
                followingCount: Math.floor(Math.random() * 400)
            });
        }
        const createdUsers = await User.insertMany(users);

        console.log("Generating 50,000+ posts and reels in batches...");
        let batchSize = 1000;
        let totalTarget = 50000;

        for (let b = 0; b < totalTarget; b += batchSize) {
            let postsBatch = [];
            for (let j = 0; j < batchSize; j++) {
                let randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
                let isReel = Math.random() > 0.5; // 50% split between image posts and video reels
                
                postsBatch.push({
                    user: randomUser._id,
                    mediaType: isReel ? 'reel' : 'image',
                    mediaUrl: isReel 
                        ? sampleReels[Math.floor(Math.random() * sampleReels.length)]
                        : sampleImages[Math.floor(Math.random() * sampleImages.length)],
                    caption: `Amazing view! #${b + j} #trending #explore #viral`,
                    likesCount: Math.floor(Math.random() * 8000),
                    commentsCount: Math.floor(Math.random() * 500)
                });
            }
            await Post.insertMany(postsBatch);
            console.log(`Inserted batch up to ${b + batchSize} records...`);
        }

        console.log("Database successfully seeded with 50,000+ items!");
        process.exit(0);
    } catch (err) {
        console.error("Seeding error:", err);
        process.exit(1);
    }
}

seedDatabase();
