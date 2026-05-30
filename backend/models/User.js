import mongoose from "mongoose";

const followRequestSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true,
    lowercase: true,
    trim: true
  },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  reading: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
  completed: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
  image: { type: String, default: "" },
  coverImage: { type: String, default: "" },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  followRequests: [followRequestSchema],  // Add this field
  bio: { type: String, default: "" },
  location: { type: String, default: "" },
  website: { type: String, default: "" },
  googleId: { type: String, sparse: true },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
});

export default mongoose.model('User', userSchema);