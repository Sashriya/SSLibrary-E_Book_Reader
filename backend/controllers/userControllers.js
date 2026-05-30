import User from "../models/User.js";
import mongoose from "mongoose";
import Story from "../models/Story.js";
import Notification from "../models/Notification.js";
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Helper: Build absolute image URL ────────────────────────────────────────
const buildImageUrl = (imagePath, req) => {
  if (!imagePath || imagePath.trim() === "") return "";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
  return `${req.protocol}://${req.get("host")}${imagePath}`;
};

// ─── Helper: Format user object for response ──────────────────────────────────
const formatUserResponse = (user, req) => {
  if (!user) return null;
  const userObj = user.toObject ? user.toObject() : { ...user };
  return {
    ...userObj,
    image: buildImageUrl(userObj.image, req),
    coverImage: buildImageUrl(userObj.coverImage, req),
    password: undefined,
  };
};

// ─── Helper: Create notification (never notify self) ─────────────────────────
const createNotification = async (recipientId, senderId, type, storyId, message) => {
  try {
    if (!recipientId || !senderId) {
      console.warn("createNotification: missing recipientId or senderId");
      return null;
    }
    if (recipientId.toString() === senderId.toString()) return null;

    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      storyId: storyId || undefined,
      message,
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error("createNotification error:", JSON.stringify(error?.errors || error, null, 2));
    return null;
  }
};

// ─── Notify followers when a new story is published ───────────────────────────
export const notifyFollowersOfNewStory = async (story) => {
  try {
    const author = await User.findOne({ username: story.author }).select("_id username followers");
    if (!author || !author.followers?.length) return;

    const results = await Promise.allSettled(
      author.followers.map((followerId) =>
        createNotification(
          followerId,
          author._id,
          "story_published",
          story._id,
          `${author.username} published a new story: "${story.title}"`
        )
      )
    );

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length) console.error(`notifyFollowersOfNewStory: ${failed.length} failed`);
  } catch (err) {
    console.error("notifyFollowersOfNewStory error:", err);
  }
};

// ─── PROFILE PICTURE UPLOAD (MOVED HERE FROM server.js & userRoutes.js) ──────
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    // Optimize image with Sharp
    const optimizedPath = req.file.path;
    const tempPath = optimizedPath + '.temp';
    
    try {
      await sharp(req.file.path)
        .resize(400, 400, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(tempPath);
      
      fs.unlinkSync(optimizedPath);
      fs.renameSync(tempPath, optimizedPath);
    } catch (sharpError) {
      console.error("Sharp optimization error:", sharpError);
    }

    const imageUrl = `/uploads/profiles/${req.file.filename}`;

    // Delete old image if exists
    const user = await User.findById(req.user.id);
    if (user && user.image && user.image !== "" && !user.image.startsWith("http")) {
      const oldImagePath = path.join(__dirname, '../', user.image);
      if (fs.existsSync(oldImagePath)) {
        try {
          fs.unlinkSync(oldImagePath);
        } catch (unlinkError) {
          console.error("Error deleting old image:", unlinkError);
        }
      }
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { image: imageUrl } },
      { returnDocument: 'after' }
    )
    .select('-password')
    .populate('favorites reading completed');

    const fullImageUrl = buildImageUrl(imageUrl, req);
    
    let coverUrl = updatedUser.coverImage || "";
    if (coverUrl && !coverUrl.startsWith('http') && coverUrl !== "") {
      coverUrl = `http://localhost:5000${coverUrl}`;
    }

    return res.json({
      ...updatedUser.toObject(),
      image: fullImageUrl,
      coverImage: coverUrl
    });
  } catch (err) {
    console.error("Profile upload error:", err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ msg: 'Server Error: ' + err.message });
  }
};

// ─── Add story to reading list ────────────────────────────────────────────────
const addtoReading = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const id = req.params.storyId;
    const alreadyReading   = user.reading.some(x => x.toString() === id);
    const alreadyCompleted = user.completed.some(x => x.toString() === id);

    if (!alreadyReading && !alreadyCompleted) {
      user.reading.push(new mongoose.Types.ObjectId(id));
      await user.save();
    }

    const updated = await User.findById(req.user.id)
      .select("-password")
      .populate("reading favorites completed");

    res.json(formatUserResponse(updated, req));
  } catch (err) {
    console.error("addtoReading error:", err);
    res.status(500).json({ msg: "Error: " + err.message });
  }
};

// ─── Toggle favorite ──────────────────────────────────────────────────────────
const toggleFavorite = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const id = req.params.storyId;
    if (user.favorites.some(x => x.toString() === id)) {
      user.favorites = user.favorites.filter(x => x.toString() !== id);
    } else {
      user.favorites.push(new mongoose.Types.ObjectId(id));
    }
    await user.save();

    const updated = await User.findById(req.user.id)
      .select("-password")
      .populate("reading favorites completed");

    res.json(formatUserResponse(updated, req));
  } catch (err) {
    console.error("toggleFavorite error:", err);
    res.status(500).json({ msg: "Error: " + err.message });
  }
};

// ─── Mark story as completed ──────────────────────────────────────────────────
const markAsCompleted = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const id = req.params.storyId;
    user.reading = user.reading.filter(x => x.toString() !== id);
    if (!user.completed.some(x => x.toString() === id)) {
      user.completed.push(new mongoose.Types.ObjectId(id));
    }
    await user.save();

    const updated = await User.findById(req.user.id)
      .select("-password")
      .populate("reading favorites completed");

    res.json(formatUserResponse(updated, req));
  } catch (err) {
    console.error("markAsCompleted error:", err);
    res.status(500).json({ msg: "Error: " + err.message });
  }
};

// ─── Get user library ─────────────────────────────────────────────────────────
const getUserLibrary = async (req, res) => {
  try {
    const type = req.query.type;
    const allowedTypes = ["reading", "favorites", "completed"];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ msg: "Invalid library type" });
    }

    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("reading favorites completed");

    if (!user) return res.status(404).json({ msg: "User not found" });

    let result = user[type] || [];

    if (type === "reading") {
      const completedIds = new Set(user.completed.map(c => (c?._id ?? c).toString()));
      result = result.filter(story => !completedIds.has((story?._id ?? story).toString()));
    }

    const seen = new Set();
    const unique = result.filter(item => {
      const id = (item?._id ?? item).toString();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    const storiesWithCounts = unique.map(story => {
      const s = story.toObject ? story.toObject() : story;
      return {
        ...s,
        likesCount:    s.likes?.length    || 0,
        commentsCount: s.comments?.length || 0,
        viewsCount:    s.views            || 0,
        isLikedByUser: s.likes?.some(like => like.user?._id?.toString() === req.user.id) || false,
      };
    });

    res.json(storiesWithCounts);
  } catch (err) {
    console.error("getUserLibrary error:", err);
    res.status(500).json({ msg: "Error: " + err.message });
  }
};

// ─── Get story interactions ───────────────────────────────────────────────────
const getStoryInteractions = async (req, res) => {
  try {
    const { storyId } = req.params;
    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ msg: "Story not found" });

    const isLiked = story.likes?.some(like => like.user?._id?.toString() === req.user.id) || false;

    const commentsWithDetails = (story.comments || [])
      .map(comment => ({
        _id: comment._id,
        text: comment.text,
        createdAt: comment.createdAt,
        user: {
          id:       comment.user?._id?.toString(),
          username: comment.user?.username || "Unknown",
          image:    buildImageUrl(comment.user?.image || "", req),
        },
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      likes:         story.likes?.length    || 0,
      isLiked,
      comments:      commentsWithDetails,
      totalComments: story.comments?.length || 0,
    });
  } catch (err) {
    console.error("getStoryInteractions error:", err);
    res.status(500).json({ msg: "Server Error: " + err.message });
  }
};

// ─── Toggle like ──────────────────────────────────────────────────────────────
const toggleLike = async (req, res) => {
  try {
    const { storyId } = req.params;
    const [story, user] = await Promise.all([
      Story.findById(storyId),
      User.findById(req.user.id),
    ]);
    if (!story) return res.status(404).json({ msg: "Story not found" });
    if (!user)  return res.status(404).json({ msg: "User not found" });

    const alreadyLiked = story.likes?.some(like => like.user?._id?.toString() === req.user.id);

    if (alreadyLiked) {
      story.likes = story.likes.filter(like => like.user?._id?.toString() !== req.user.id);
    } else {
      story.likes.push({ user: { _id: req.user.id, username: user.username }, createdAt: new Date() });

      if (story.author !== user.username) {
        const storyAuthor = await User.findOne({ username: story.author });
        if (storyAuthor) {
          await createNotification(
            storyAuthor._id,
            req.user.id,
            "like",
            story._id,
            `${user.username} liked your story "${story.title}"`
          );
        }
      }
    }

    await story.save();
    res.json({ likes: story.likes.length, isLiked: !alreadyLiked, storyId: story._id });
  } catch (err) {
    console.error("toggleLike error:", err);
    res.status(500).json({ msg: "Server Error: " + err.message });
  }
};

// ─── Add comment ──────────────────────────────────────────────────────────────
const addComment = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ msg: "Comment cannot be empty" });
    }

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ msg: "Story not found" });
    }

    const user = await User.findById(req.user.id).select('username image');
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const newComment = {
      user: {
        id: req.user.id.toString(),
        _id: req.user.id.toString(),
        username: user.username,
        image: user.image || ""
      },
      text: text.trim(),
      createdAt: new Date()
    };

    story.comments.push(newComment);
    await story.save();

    if (story.author !== user.username) {
      const storyAuthor = await User.findOne({ username: story.author });
      if (storyAuthor) {
        await createNotification(
          storyAuthor._id,
          req.user.id,
          'comment',
          story._id,
          `${user.username} commented on your story`
        );
      }
    }

    const addedComment = story.comments[story.comments.length - 1];

    res.json({
      comment: {
        _id: addedComment._id,
        text: addedComment.text,
        createdAt: addedComment.createdAt,
        user: {
          id: addedComment.user.id,
          _id: addedComment.user._id,
          username: addedComment.user.username,
          image: addedComment.user.image
        }
      },
      totalComments: story.comments.length
    });
  } catch (err) {
    console.error("addComment error details:", err);
    res.status(500).json({ msg: "Server Error: " + err.message });
  }
};

// ─── Delete comment ───────────────────────────────────────────────────────────
const deleteComment = async (req, res) => {
  try {
    const { storyId, commentId } = req.params;
    
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ msg: "Story not found" });
    }

    const commentIndex = story.comments.findIndex(
      c => c._id.toString() === commentId
    );
    
    if (commentIndex === -1) {
      return res.status(404).json({ msg: "Comment not found" });
    }

    const comment = story.comments[commentIndex];
    
    const commentOwnerId = comment.user?.id || comment.user?._id;
    const currentUserId = req.user.id;
    
    if (commentOwnerId !== currentUserId && req.user.role !== 'admin') {
      return res.status(403).json({ msg: "Not authorized to delete this comment" });
    }

    story.comments.splice(commentIndex, 1);
    await story.save();

    res.json({ 
      msg: "Comment deleted successfully", 
      totalComments: story.comments.length 
    });
  } catch (err) {
    console.error("deleteComment error:", err);
    res.status(500).json({ msg: "Server Error: " + err.message });
  }
};

// ─── Track story view ─────────────────────────────────────────────────────────
const trackStoryView = async (req, res) => {
  try {
    const { storyId } = req.params;
    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ msg: "Story not found" });

    await Story.updateOne({ _id: storyId }, { $inc: { views: 1 } });

    res.json({ views: story.views, message: "View tracked successfully" });
  } catch (err) {
    console.error("trackStoryView error:", err);
    res.status(500).json({ msg: "Server Error: " + err.message });
  }
};

// ─── Get story views ──────────────────────────────────────────────────────────
const getStoryViews = async (req, res) => {
  try {
    const { storyId } = req.params;
    const story = await Story.findById(storyId).select("views title");
    if (!story) return res.status(404).json({ msg: "Story not found" });

    res.json({ views: story.views || 0, storyId: story._id, title: story.title });
  } catch (err) {
    console.error("getStoryViews error:", err);
    res.status(500).json({ msg: "Server Error: " + err.message });
  }
};

// ─── Get all stories with views ───────────────────────────────────────────────
const getAllStoriesWithViews = async (req, res) => {
  try {
    const stories = await Story.limit(20).skip(page*20)
      .select("title author views createdAt category")
      .sort({ views: -1 });
    res.json(stories);
  } catch (err) {
    console.error("getAllStoriesWithViews error:", err);
    res.status(500).json({ msg: "Server Error: " + err.message });
  }
};

// ─── Update profile ───────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { username, currentPassword, newPassword, bio, location, website } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (username && username.trim() !== user.username) {
      const existing = await User.findOne({ username: username.trim() });
      if (existing) return res.status(400).json({ msg: "Username already taken" });
      user.username = username.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ msg: "Current password is required to change password" });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ msg: "Current password is incorrect" });
      user.password = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
    }

    if (bio      !== undefined) user.bio      = bio;
    if (location !== undefined) user.location = location;
    if (website  !== undefined) user.website  = website;

    await user.save();

    const updated = await User.findById(req.user.id)
      .select("-password")
      .populate("favorites reading completed");

    res.json(formatUserResponse(updated, req));
  } catch (err) {
    console.error("updateProfile error:", err);
    res.status(500).json({ msg: "Server Error: " + err.message });
  }
};

// ─── Get own profile ──────────────────────────────────────────────────────────
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("favorites reading completed");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(formatUserResponse(user, req));
  } catch (err) {
    console.error("getUserProfile error:", err);
    res.status(500).json({ msg: "Server Error: " + err.message });
  }
};

// ─── Delete profile picture ───────────────────────────────────────────────────
const deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (user.image && !user.image.startsWith("http")) {
      const oldPath = path.join(__dirname, "..", user.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    user.image = "";
    await user.save();

    const updated = await User.findById(req.user.id)
      .select("-password")
      .populate("favorites reading completed");

    res.json(formatUserResponse(updated, req));
  } catch (err) {
    console.error("deleteProfilePicture error:", err);
    res.status(500).json({ msg: "Server Error: " + err.message });
  }
};

// ─── Upload cover image ───────────────────────────────────────────────────────
const uploadCoverImage = async (req, res) => {
  let tempPath = null;
  try {
    if (!req.file) return res.status(400).json({ msg: "No file uploaded" });

    const originalPath = req.file.path;
    tempPath = originalPath + ".optimized.webp";

    try {
      await sharp(originalPath)
        .resize(1200, 300, { fit: "cover" })
        .webp({ quality: 80 })
        .toFile(tempPath);
      fs.unlinkSync(originalPath);
      fs.renameSync(tempPath, originalPath);
      tempPath = null;
    } catch (sharpErr) {
      console.error("Sharp error (using original):", sharpErr);
      if (tempPath && fs.existsSync(tempPath)) { fs.unlinkSync(tempPath); tempPath = null; }
    }

    const imageUrl = `/uploads/covers/${req.file.filename}`;

    const existingUser = await User.findById(req.user.id);
    if (existingUser?.coverImage && !existingUser.coverImage.startsWith("http")) {
      const oldPath = path.join(__dirname, "..", existingUser.coverImage);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) { console.error("Old cover delete error:", e); }
      }
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { coverImage: imageUrl } },
      { returnDocument: 'after' }
    ).select("-password").populate("favorites reading completed");

    res.json(formatUserResponse(updated, req));
  } catch (err) {
    console.error("uploadCoverImage error:", err);
    if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ msg: "Server Error: " + err.message });
  }
};

// ─── Follow a user ────────────────────────────────────────────────────────────
const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (userId === currentUserId) {
      return res.status(400).json({ msg: "You cannot follow yourself" });
    }

    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ msg: "User not found" });
    }

    const currentUser = await User.findById(currentUserId);
    
    if (currentUser.following.includes(userId)) {
      return res.status(400).json({ msg: "Already following this user" });
    }

    currentUser.following.push(userId);
    userToFollow.followers.push(currentUserId);
    
    await currentUser.save();
    await userToFollow.save();

    await createNotification(
      userId,
      currentUserId,
      'follow',
      null,
      `${currentUser.username} started following you`
    );

    const updatedUser = await User.findById(currentUserId)
      .select('-password')
      .populate('followers following', 'username image');

    res.json({
      msg: "Followed successfully",
      user: updatedUser,
      isFollowing: true
    });
  } catch (err) {
    console.error("Follow error:", err);
    res.status(500).json({ msg: "Server error: " + err.message });
  }
};

// ─── Unfollow a user ──────────────────────────────────────────────────────────
const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const userToUnfollow = await User.findById(userId);
    if (!userToUnfollow) {
      return res.status(404).json({ msg: "User not found" });
    }

    const currentUser = await User.findById(currentUserId);
    
    if (!currentUser.following.includes(userId)) {
      return res.status(400).json({ msg: "You are not following this user" });
    }

    currentUser.following = currentUser.following.filter(
      id => id.toString() !== userId
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== currentUserId
    );
    
    await currentUser.save();
    await userToUnfollow.save();

    await createNotification(
      userId,
      currentUserId,
      'unfollow',
      null,
      `${currentUser.username} unfollowed you`
    );

    const updatedUser = await User.findById(currentUserId)
      .select('-password')
      .populate('followers following', 'username image');

    res.json({
      msg: "Unfollowed successfully",
      user: updatedUser,
      isFollowing: false
    });
  } catch (err) {
    console.error("Unfollow error:", err);
    res.status(500).json({ msg: "Server error: " + err.message });
  }
};

// ─── Get user profile by ID (public view) ────────────────────────────────────
const getUserProfileById = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const profileUser = await User.findById(userId)
      .select("-password")
      .populate("followers following", "username image bio");
    if (!profileUser) return res.status(404).json({ msg: "User not found" });

    const isFollowing = profileUser.followers.some(f => f._id.toString() === currentUserId);

    const userStories = await Story.find({ author: profileUser.username, status: "published" })
      .sort({ createdAt: -1 });

    res.json({
      user: {
        _id:        profileUser._id,
        username:   profileUser.username,
        email:      profileUser.email,
        image:      buildImageUrl(profileUser.image, req),
        coverImage: buildImageUrl(profileUser.coverImage, req),
        bio:        profileUser.bio,
        followers:  profileUser.followers,
        following:  profileUser.following,
      },
      isFollowing,
      stories:        userStories,
      storiesCount:   userStories.length,
      followersCount: profileUser.followers.length,
      followingCount: profileUser.following.length,
    });
  } catch (err) {
    console.error("getUserProfileById error:", err);
    res.status(500).json({ msg: "Server error: " + err.message });
  }
};

// ─── Search users ─────────────────────────────────────────────────────────────
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query?.trim()) return res.json([]);

    const users = await User.find({
      username: { $regex: query.trim(), $options: "i" },
      _id: { $ne: req.user.id },
    })
      .select("username image followers")
      .limit(20);

    res.json(users.map(u => ({
      _id:            u._id,
      username:       u.username,
      image:          buildImageUrl(u.image, req),
      followersCount: u.followers?.length || 0,
    })));
  } catch (err) {
    console.error("searchUsers error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ─── Update bio / location / website ─────────────────────────────────────────
const updateBio = async (req, res) => {
  try {
    const { bio, location, website } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (bio      !== undefined) user.bio      = bio;
    if (location !== undefined) user.location = location;
    if (website  !== undefined) user.website  = website;
    await user.save();

    const updated = await User.findById(req.user.id)
      .select("-password")
      .populate("followers following", "username image");

    res.json(formatUserResponse(updated, req));
  } catch (err) {
    console.error("updateBio error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ─── Get following list ───────────────────────────────────────────────────────
const getFollowingList = async (req, res) => {
  try {
    const { userId } = req.params;
    const [user, currentUser] = await Promise.all([
      User.findById(userId).populate("following", "username image bio followers"),
      User.findById(req.user.id),
    ]);
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json(user.following.map(f => ({
      _id:            f._id,
      username:       f.username,
      image:          buildImageUrl(f.image, req),
      bio:            f.bio || "",
      followersCount: f.followers?.length || 0,
      isFollowing:    currentUser.following.some(id => id.toString() === f._id.toString()),
    })));
  } catch (err) {
    console.error("getFollowingList error:", err);
    res.status(500).json({ msg: "Server error: " + err.message });
  }
};

// ─── Get followers list ───────────────────────────────────────────────────────
const getFollowersList = async (req, res) => {
  try {
    const { userId } = req.params;
    const [user, currentUser] = await Promise.all([
      User.findById(userId).populate("followers", "username image bio followers"),
      User.findById(req.user.id),
    ]);
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json(user.followers.map(f => ({
      _id:            f._id,
      username:       f.username,
      image:          buildImageUrl(f.image, req),
      bio:            f.bio || "",
      followersCount: f.followers?.length || 0,
      isFollowing:    currentUser.following.some(id => id.toString() === f._id.toString()),
    })));
  } catch (err) {
    console.error("getFollowersList error:", err);
    res.status(500).json({ msg: "Server error: " + err.message });
  }
};

// ─── Get suggested users ──────────────────────────────────────────────────────
const getSuggestedUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);

    const suggested = await User.find({
      _id: { $ne: req.user.id, $nin: currentUser.following },
    })
      .select("username image bio followers")
      .limit(10)
      .sort({ createdAt: -1 });

    res.json(suggested.map(u => ({
      _id:            u._id,
      username:       u.username,
      image:          buildImageUrl(u.image, req),
      bio:            u.bio,
      followersCount: u.followers.length,
      isFollowing:    false,
    })));
  } catch (err) {
    console.error("getSuggestedUsers error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ─── Get notifications ────────────────────────────────────────────────────────
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total] = await Promise.all([
      Notification.find({ recipient: req.user.id })
        .populate("sender", "username image")
        .populate("storyId", "title slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments({ recipient: req.user.id }),
    ]);

    const formatted = notifications.map(n => {
      const obj = n.toObject();
      if (obj.sender?.image) obj.sender.image = buildImageUrl(obj.sender.image, req);
      return obj;
    });

    res.json({
      notifications: formatted,
      total,
      page:       parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error("getNotifications error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ─── Get unread notification count ───────────────────────────────────────────
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user.id, read: false });
    res.json({ count });
  } catch (err) {
    console.error("getUnreadCount error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ─── Mark one notification as read ───────────────────────────────────────────
const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, recipient: req.user.id },
      { read: true },
      { returnDocument: 'after' }
    );
    if (!notification) return res.status(404).json({ msg: "Notification not found" });
    res.json(notification);
  } catch (err) {
    console.error("markNotificationRead error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ─── Mark all notifications as read ──────────────────────────────────────────
const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    console.error("markAllNotificationsRead error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ─── Delete one notification ──────────────────────────────────────────────────
const deleteNotification = async (req, res) => {
  try {
    const deleted = await Notification.findOneAndDelete({
      _id: req.params.notificationId,
      recipient: req.user.id,
    });
    if (!deleted) return res.status(404).json({ msg: "Notification not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("deleteNotification error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ─── Google Login ─────────────────────────────────────────────────────────────
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ msg: "No token provided" });

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, picture, sub: googleId } = ticket.getPayload();
    if (!email) return res.status(400).json({ msg: "Email not provided by Google" });

    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) { user.googleId = googleId; await user.save(); }
    } else {
      const base = name.toLowerCase().replace(/\s+/g, "");
      let username = base + Math.floor(Math.random() * 1000);
      while (await User.findOne({ username })) {
        username = base + Math.floor(Math.random() * 10000);
      }
      const hashedPassword = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10);
      user = new User({
        username, email, googleId,
        image:     picture || "",
        password:  hashedPassword,
        favorites: [], reading: [], completed: [],
      });
      await user.save();
    }

    const jwtToken = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token: jwtToken,
      user: {
        _id:        user._id,
        username:   user.username,
        email:      user.email,
        role:       user.role,
        image:      buildImageUrl(user.image || picture || "", req),
        coverImage: buildImageUrl(user.coverImage || "", req),
        favorites:  user.favorites  || [],
        reading:    user.reading    || [],
        completed:  user.completed  || [],
      },
    });
  } catch (err) {
    console.error("googleLogin error:", err);
    res.status(500).json({ msg: "Google authentication failed: " + err.message });
  }
};

// ─── Email transporter ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// ─── Forgot password ──────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ msg: "No account found with this email" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken   = resetToken;
    user.resetPasswordExpires = Date.now() + 3_600_000;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from:    process.env.EMAIL_USER,
      to:      user.email,
      subject: "Password Reset Request — Tamil Library",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#d97706;">Reset Your Password</h2>
          <p>Hello ${user.username},</p>
          <p>You requested to reset your password. Click the button below to set a new password:</p>
          <a href="${resetUrl}"
             style="display:inline-block;background:#d97706;color:#fff;padding:12px 24px;
                    text-decoration:none;border-radius:8px;margin:20px 0;">
            Reset Password
          </a>
          <p>This link will expire in <strong>1 hour</strong>.</p>
          <p>If you did not request this, please ignore this email.</p>
          <hr style="margin:20px 0;border-color:#e2e8f0;"/>
          <p style="color:#64748b;font-size:12px;">SS Tamil Library</p>
        </div>`,
    });

    res.json({ msg: "Password reset email sent successfully" });
  } catch (err) {
    console.error("forgotPassword error:", err);
    res.status(500).json({ msg: "Failed to send reset email" });
  }
};

// ─── Reset password ───────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ msg: "Token and new password are required" });
    }

    const user = await User.findOne({
      resetPasswordToken:   token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ msg: "Invalid or expired reset token" });

    user.password             = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ msg: "Password reset successful. You can now login with your new password." });
  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({ msg: "Failed to reset password" });
  }
};

// ─── Send follow request ──────────────────────────────────────────────────────
const sendFollowRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (userId === currentUserId) {
      return res.status(400).json({ msg: "You cannot follow yourself" });
    }

    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ msg: "User not found" });
    }

    const currentUser = await User.findById(currentUserId);

    if (currentUser.following.includes(userId)) {
      return res.status(400).json({ msg: "Already following this user" });
    }

    const existingRequest = userToFollow.followRequests.find(
      req => req.from.toString() === currentUserId && req.status === 'pending'
    );
    if (existingRequest) {
      return res.status(400).json({ msg: "Follow request already sent" });
    }

    userToFollow.followRequests.push({
      from: currentUserId,
      status: 'pending',
      createdAt: new Date()
    });
    await userToFollow.save();

    await createNotification(
      userId,
      currentUserId,
      'follow_request',
      null,
      `${currentUser.username} wants to follow you`
    );

    res.json({ msg: "Follow request sent successfully" });
  } catch (err) {
    console.error("sendFollowRequest error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ─── Accept follow request ────────────────────────────────────────────────────
const acceptFollowRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const currentUser = await User.findById(currentUserId);
    const requester = await User.findById(userId);

    if (!currentUser || !requester) {
      return res.status(404).json({ msg: "User not found" });
    }

    const requestIndex = currentUser.followRequests.findIndex(
      req => req.from.toString() === userId && req.status === 'pending'
    );

    if (requestIndex === -1) {
      return res.status(404).json({ msg: "Follow request not found" });
    }

    currentUser.followRequests[requestIndex].status = 'accepted';
    
    currentUser.followers.push(userId);
    requester.following.push(currentUserId);

    await currentUser.save();
    await requester.save();

    await createNotification(
      userId,
      currentUserId,
      'follow_accepted',
      null,
      `${currentUser.username} accepted your follow request`
    );

    const updatedUser = await User.findById(currentUserId)
      .select('-password')
      .populate('followers following', 'username image');

    res.json({
      msg: "Follow request accepted",
      user: updatedUser,
      followersCount: currentUser.followers.length,
      followingCount: currentUser.following.length
    });
  } catch (err) {
    console.error("acceptFollowRequest error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ─── Reject follow request ────────────────────────────────────────────────────
const rejectFollowRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    const requestIndex = currentUser.followRequests.findIndex(
      req => req.from.toString() === userId && req.status === 'pending'
    );

    if (requestIndex === -1) {
      return res.status(404).json({ msg: "Follow request not found" });
    }

    currentUser.followRequests[requestIndex].status = 'rejected';
    await currentUser.save();

    res.json({ msg: "Follow request rejected" });
  } catch (err) {
    console.error("rejectFollowRequest error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ─── Get pending follow requests ──────────────────────────────────────────────
const getPendingFollowRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('followRequests')
      .populate('followRequests.from', 'username image bio');

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const pendingRequests = user.followRequests.filter(
      req => req.status === 'pending'
    );

    const formattedRequests = pendingRequests.map(req => ({
      _id: req._id,
      from: req.from,
      status: req.status,
      createdAt: req.createdAt
    }));

    res.json(formattedRequests);
  } catch (err) {
    console.error("getPendingFollowRequests error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ─── Get follow requests count ────────────────────────────────────────────────
const getFollowRequestsCount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('followRequests');
    const count = user.followRequests.filter(req => req.status === 'pending').length;
    res.json({ count });
  } catch (err) {
    console.error("getFollowRequestsCount error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ─── Exports ──────────────────────────────────────────────────────────────────
export default {
  // User Library
  addtoReading,
  toggleFavorite,
  markAsCompleted,
  getUserLibrary,
  
  // Story Interactions
  getStoryInteractions,
  toggleLike,
  addComment,
  deleteComment,
  
  // Views
  trackStoryView,
  getStoryViews,
  getAllStoriesWithViews,
  
  // Profile
  updateProfile,
  getUserProfile,
  deleteProfilePicture,
  uploadCoverImage,
  uploadProfilePicture, // MOVED HERE - No duplicate
  
  // Follow/Unfollow
  followUser,
  unfollowUser,
  getUserProfileById,
  
  // Follow Requests
  sendFollowRequest,
  acceptFollowRequest,
  rejectFollowRequest,
  getPendingFollowRequests,
  getFollowRequestsCount,
  
  // Search
  searchUsers,
  getSuggestedUsers,
  
  // Lists
  getFollowersList,
  getFollowingList,
  
  // Bio
  updateBio,
  
  // Notifications
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  
  // Auth
  googleLogin,
  forgotPassword,
  resetPassword,
  notifyFollowersOfNewStory,
};