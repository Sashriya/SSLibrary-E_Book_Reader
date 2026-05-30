import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "follow",           // someone followed you (direct)
        "unfollow",         // someone unfollowed you
        "follow_request",   // someone sent a follow request
        "follow_accepted",  // your follow request was accepted
        "like",             // someone liked your story
        "comment",          // someone commented on your story
        "post",             // general post notification
        "story_published",  // an author you follow published a new story
      ],
      required: true,
    },
    storyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,   // adds createdAt + updatedAt automatically
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// For fetching a user's notifications sorted by newest first
notificationSchema.index({ recipient: 1, createdAt: -1 });

// For counting / filtering unread notifications quickly
notificationSchema.index({ recipient: 1, read: 1 });

// For finding notifications by type (e.g. all pending follow_requests)
notificationSchema.index({ recipient: 1, type: 1 });

// Auto-delete notifications older than 90 days
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 }  // 90 days TTL
);

export default mongoose.model("Notification", notificationSchema);