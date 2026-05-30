import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  user: {
    id: { type: String, default: "" },
    _id: { type: String, default: "" },
    username: { type: String, default: "" },
    image: { type: String, default: "" }
  },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const likeSchema = new mongoose.Schema({
  user: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String
  },
  createdAt: { type: Date, default: Date.now }
});

const storySchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, required: true },
    image: { type: String, default: "" },
    category: { type: String, default: "General" },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    createdAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
    likes: [likeSchema],
    comments: [commentSchema],
    views: { type: Number, default: 0 }  
});

export default mongoose.model('Story', storySchema);