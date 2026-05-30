import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import auth from './middleware/auth.js';
import User from './models/User.js';
import Story from './models/Story.js';
import userRoutes from "./routes/userRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const profilesDir = path.join(uploadsDir, 'profiles');
const coversDir = path.join(uploadsDir, 'covers');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}
if (!fs.existsSync(coversDir)) {
  fs.mkdirSync(coversDir, { recursive: true });
}

// Static files serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Security and Rate Limiting
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { msg: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use("/api/user", userRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/novels')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB Error:', err));

// ─── REGISTER ────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        if (!username || !email || !password)
            return res.status(400).json({ msg: 'All fields are required' });

        const normalizedEmail = email.trim().toLowerCase();

        const existingUsername = await User.findOne({ username: username.trim() });
        if (existingUsername) return res.status(400).json({ msg: 'Username already taken' });

        const existingEmail = await User.findOne({ email: normalizedEmail });
        if (existingEmail) return res.status(400).json({ msg: 'Email already registered' });

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);

        const user = new User({
            username: username.trim(),
            email: normalizedEmail,
            password: hashed,
            favorites: [],
            reading: [],
            completed: [],
            image: "",
            coverImage: ""
        });

        await user.save();

        const token = jwt.sign(
            { id: user._id, role: user.role, username: user.username },
            process.env.JWT_SECRET || "secretkey",
            { expiresIn: "1d" }
        );

        return res.status(200).json({
            msg: 'User Successfully Registered',
            token,
            user: {
                id: user._id,
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                image: "",
                coverImage: "",
                favorites: [],
                reading: [],
                completed: []
            }
        });

    } catch (err) {
        console.error("Register Error:", err);
        return res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// ─── LOGIN ────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ msg: 'Email and password are required' });

        const normalizedEmail = email.trim().toLowerCase();
        const trimmedPassword = password.trim();

        // Static Admin Login
        if (normalizedEmail === "admin@sash.com") {
            const adminPassword = process.env.ADMIN_PASSWORD || "admin12345";
            if (trimmedPassword === adminPassword) {
                const token = jwt.sign(
                    { id: "static_admin", role: "admin", username: "Admin Sash" },
                    process.env.JWT_SECRET || "secretkey",
                    { expiresIn: "1d" }
                );
                return res.json({
                    token,
                    user: {
                        id: "static_admin",
                        _id: "static_admin",
                        username: "Admin Sash",
                        role: "admin",
                        email: "admin@sash.com",
                        image: "",
                        coverImage: "",
                        favorites: [],
                        reading: [],
                        completed: []
                    },
                    msg: 'Admin Login Successful'
                });
            } else {
                return res.status(401).json({ msg: 'Invalid admin credentials' });
            }
        }

        // Regular User Login
        const user = await User.findOne({ email: normalizedEmail })
            .select('+password')
            .populate('favorites reading completed');

        if (!user) return res.status(401).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(trimmedPassword, user.password);
        if (!isMatch) return res.status(401).json({ msg: 'Invalid Credentials' });

        const token = jwt.sign(
            { id: user._id, role: user.role, username: user.username },
            process.env.JWT_SECRET || "secretkey",
            { expiresIn: "1d" }
        );

        let imageUrl = user.image || "";
        if (imageUrl && !imageUrl.startsWith('http') && imageUrl !== "") {
            imageUrl = `http://localhost:5000${imageUrl}`;
        }
        
        let coverUrl = user.coverImage || "";
        if (coverUrl && !coverUrl.startsWith('http') && coverUrl !== "") {
            coverUrl = `http://localhost:5000${coverUrl}`;
        }

        return res.json({
            token,
            user: {
                id: user._id,
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                image: imageUrl,
                coverImage: coverUrl,
                favorites: user.favorites || [],
                reading: user.reading || [],
                completed: user.completed || []
            },
            msg: 'Login Successful'
        });

    } catch (err) {
        console.error("Login Error:", err);
        return res.status(500).json({ msg: "Server Error", error: err.message });
    }
});

// ─── DELETE PROFILE PICTURE ──────────────────────────────────────
app.delete('/api/auth/delete-profile-picture', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (user.image && user.image !== "") {
            const oldImagePath = path.join(__dirname, user.image);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        user.image = "";
        await user.save();

        const updatedUser = await User.findById(req.user.id)
            .select('-password')
            .populate('favorites reading completed');
        
        let coverUrl = updatedUser.coverImage || "";
        if (coverUrl && !coverUrl.startsWith('http') && coverUrl !== "") {
            coverUrl = `http://localhost:5000${coverUrl}`;
        }

        return res.json({
            ...updatedUser.toObject(),
            image: "",
            coverImage: coverUrl
        });

    } catch (err) {
        console.error("Delete profile picture error:", err);
        return res.status(500).json({ msg: 'Server Error' });
    }
});

// ─── STORIES ──────────────────────────────────────────────────────
app.get('/api/stories', async (req, res) => {
    try {
        const stories = await Story.find({ status: 'published' }).sort({ createdAt: -1 });
        return res.json(stories);
    } catch (err) { 
        console.error(err);
        res.status(500).send('Server Error'); 
    }
});

app.post('/api/stories', auth, async (req, res) => {
    try {
        const newStory = new Story({
            ...req.body,
            author: req.user.username,
            status: req.body.status || 'published'
        });
        await newStory.save();
        
        if (newStory.status === 'published') {
            try {
                const { notifyFollowersOfNewStory } = await import('./controllers/userControllers.js');
                await notifyFollowersOfNewStory(newStory);
                console.log(`📢 Notified followers about new story: ${newStory.title}`);
            } catch (notifyErr) {
                console.error("Failed to send story notifications:", notifyErr);
            }
        }
        
        return res.status(200).json(newStory);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ msg: "Failed to save story" }); 
    }
});

app.get('/api/stories/:id', async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ msg: "Story not found" });
        return res.json(story);
    } catch (err) { 
        console.error(err);
        res.status(500).send('Server Error'); 
    }
});

app.put('/api/stories/:id', auth, async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ msg: 'Manuscript not found' });

        const storyAuthor = (story.author || "").trim().toLowerCase();
        const currentUser = (req.user?.username || "").trim().toLowerCase();

        if (req.user.role !== 'admin' && storyAuthor !== currentUser)
            return res.status(403).json({ msg: `Not Authorized. This story belongs to ${story.author}` });

        const oldStatus = story.status;
        const updated = await Story.findByIdAndUpdate(
            req.params.id,
            { ...req.body, lastUpdated: Date.now() },
            { returnDocument: 'after' }
        );
        
        if (oldStatus !== 'published' && updated.status === 'published') {
            try {
                const { notifyFollowersOfNewStory } = await import('./controllers/userControllers.js');
                await notifyFollowersOfNewStory(updated);
                console.log(`📢 Notified followers about newly published story: ${updated.title}`);
            } catch (notifyErr) {
                console.error("Failed to send story notifications:", notifyErr);
            }
        }
        
        return res.status(200).json(updated);
    } catch (err) { 
        console.error(err);
        res.status(500).send('Server error during update'); 
    }
});

app.delete('/api/stories/:id', auth, async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ msg: 'Story not found' });

        const storyAuthor = (story.author || "").trim().toLowerCase();
        const currentUser = (req.user?.username || "").trim().toLowerCase();

        if (req.user.role !== 'admin' && storyAuthor !== currentUser)
            return res.status(403).json({ msg: 'Not Authorized' });

        await Story.findByIdAndDelete(req.params.id);
        return res.json({ msg: 'Deleted' });
    } catch (err) { 
        console.error(err);
        res.status(500).send('Delete Error'); 
    }
});

// ─── ADMIN ────────────────────────────────────────────────────────
app.get('/api/admin/stories', auth, async (req, res) => {
    if (req.user.role !== 'admin')
        return res.status(403).json({ msg: 'Forbidden: Admins only' });
    try {
        const stories = await Story.find().sort({ createdAt: -1 });
        return res.json(stories);
    } catch (err) { 
        console.error(err);
        res.status(500).send('Server Error'); 
    }
});

// ─── AUTH ME ──────────────────────────────────────────────────────
app.get('/api/auth/me', auth, async (req, res) => {
    try {
        if (req.user.id === "static_admin") {
            return res.json({
                _id: "static_admin",
                id: "static_admin",
                username: "Admin Sash",
                email: "admin@sash.com",
                role: "admin",
                image: "",
                coverImage: "",
                favorites: [],
                reading: [],
                completed: []
            });
        }

        const user = await User.findById(req.user.id)
            .select('-password')
            .populate('favorites reading completed');

        if (!user) return res.status(404).json({ msg: 'User not found' });

        let imageUrl = user.image || "";
        if (imageUrl && !imageUrl.startsWith('http') && imageUrl !== "") {
            imageUrl = `http://localhost:5000${imageUrl}`;
        }
        
        let coverUrl = user.coverImage || "";
        if (coverUrl && !coverUrl.startsWith('http') && coverUrl !== "") {
            coverUrl = `http://localhost:5000${coverUrl}`;
        }

        return res.json({
            ...user.toObject(),
            image: imageUrl,
            coverImage: coverUrl
        });
    } catch (err) {
        console.error("Auth/me error:", err);
        res.status(500).send('Server Error');
    }
});

// ─── PROFILE UPDATE ──────────────────────────────────────────────
app.put('/api/auth/update-profile', auth, async (req, res) => {
    try {
        const { username, currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username: username.trim() });
            if (existingUser) {
                return res.status(400).json({ msg: "Username already taken" });
            }
            user.username = username.trim();
        }
        
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ msg: "Current password is required to change password" });
            }
            
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ msg: "Current password is incorrect" });
            }
            
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }
        
        await user.save();
        
        const updatedUser = await User.findById(userId)
            .select('-password')
            .populate('favorites reading completed');
        
        let imageUrl = updatedUser.image || "";
        if (imageUrl && !imageUrl.startsWith('http') && imageUrl !== "") {
            imageUrl = `http://localhost:5000${imageUrl}`;
        }
        
        let coverUrl = updatedUser.coverImage || "";
        if (coverUrl && !coverUrl.startsWith('http') && coverUrl !== "") {
            coverUrl = `http://localhost:5000${coverUrl}`;
        }
        
        return res.json({
            ...updatedUser.toObject(),
            image: imageUrl,
            coverImage: coverUrl
        });
        
    } catch (err) {
        console.error("Profile update error:", err);
        return res.status(500).json({ msg: 'Server Error: ' + err.message });
    }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));