import express from "express";
import auth from "../middleware/auth.js";
import userController from "../controllers/userControllers.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Create uploads directories if they don't exist
const uploadsDir = path.join(__dirname, '../uploads');
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

// Multer Configuration for Profile Pictures
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${req.user.id}-${uniqueSuffix}.webp`);
  }
});

const profileFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: profileFileFilter
});

// Multer Configuration for Cover Images
const coverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, coversDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `cover-${req.user.id}-${uniqueSuffix}.webp`);
  }
});

const coverFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, PNG, WEBP)'), false);
  }
};

const uploadCover = multer({
  storage: coverStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: coverFileFilter
});

// ========== USER LIBRARY ROUTES ==========
router.post("/favorites/:storyId", auth, userController.toggleFavorite);
router.post("/reading/:storyId", auth, userController.addtoReading);
router.post("/complete/:storyId", auth, userController.markAsCompleted);
router.get("/library", auth, userController.getUserLibrary);

// ========== PROFILE ROUTES ==========
router.get("/profile", auth, userController.getUserProfile);
router.put("/profile", auth, userController.updateProfile);

// Profile Picture Upload - CLEAN (only multer middleware, logic in controller)
router.post("/profile/upload-picture", auth, uploadProfile.single('profilePicture'), userController.uploadProfilePicture);

router.delete("/profile/picture", auth, userController.deleteProfilePicture);

// Cover Image Upload
router.post("/upload-cover", auth, uploadCover.single('coverImage'), userController.uploadCoverImage);

// ========== LIKES AND COMMENTS ROUTES ==========
router.get("/story/:storyId/interactions", auth, userController.getStoryInteractions);
router.post("/story/:storyId/like", auth, userController.toggleLike);
router.post("/story/:storyId/comment", auth, userController.addComment);
router.delete("/story/:storyId/comment/:commentId", auth, userController.deleteComment);

// ========== VIEWS ROUTES ==========
router.post("/story/:storyId/view", auth, userController.trackStoryView);
router.get("/story/:storyId/views", auth, userController.getStoryViews);
router.get("/stories/views/all", auth, userController.getAllStoriesWithViews);

// ========== FOLLOW/UNFOLLOW ROUTES ==========
router.post("/follow/:userId", auth, userController.followUser);
router.delete("/unfollow/:userId", auth, userController.unfollowUser);
router.get("/profile/:userId", auth, userController.getUserProfileById);

// ========== FOLLOW REQUEST ROUTES ==========
router.post("/follow-request/:userId", auth, userController.sendFollowRequest);
router.put("/follow-request/:userId/accept", auth, userController.acceptFollowRequest);
router.delete("/follow-request/:userId/reject", auth, userController.rejectFollowRequest);
router.get("/follow-requests/pending", auth, userController.getPendingFollowRequests);
router.get("/follow-requests/count", auth, userController.getFollowRequestsCount);

// ========== USER SEARCH ROUTES ==========
router.get("/search", auth, userController.searchUsers);
router.get("/suggested", auth, userController.getSuggestedUsers);

// ========== FOLLOWERS/FOLLOWING LISTS ROUTES ==========
router.get("/followers/:userId", auth, userController.getFollowersList);
router.get("/following/:userId", auth, userController.getFollowingList);

// ========== BIO/INFO UPDATE ROUTES ==========
router.put("/bio", auth, userController.updateBio);

// ========== NOTIFICATION ROUTES ==========
router.get("/notifications", auth, userController.getNotifications);
router.get("/notifications/unread-count", auth, userController.getUnreadCount);
router.put("/notifications/:notificationId/read", auth, userController.markNotificationRead);
router.put("/notifications/read-all", auth, userController.markAllNotificationsRead);
router.delete("/notifications/:notificationId", auth, userController.deleteNotification);

// ========== AUTHENTICATION ROUTES ==========
router.post("/google-login", userController.googleLogin);
router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password", userController.resetPassword);

export default router;