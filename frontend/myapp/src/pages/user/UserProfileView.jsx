// pages/user/UserProfileView.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import FollowersModal from "../../components/FollowersModal";
import {
  BookOpen,
  Loader2,
  Eye,
  ThumbsUp,
  MessageCircle,
  Mail,
  UserPlus,
  UserCheck,
  ArrowLeft,
  FileText,
  Users,
  UserMinus,
} from "lucide-react";

export default function UserProfileView() {
  const { userId } = useParams();
  const { user: currentUser, setUser } = useAuth();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [storiesCount, setStoriesCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [showUnfollowConfirm, setShowUnfollowConfirm] = useState(false);

  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followingModalOpen, setFollowingModalOpen] = useState(false);

  useEffect(() => {
    if (userId) fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/user/profile/${userId}`);
      setProfileUser(res.data.user);
      setStories(res.data.stories || []);
      setIsFollowing(res.data.isFollowing || false);
      setFollowersCount(res.data.followersCount || 0);
      setFollowingCount(res.data.followingCount || 0);
      setStoriesCount(res.data.storiesCount || 0);
      // Reset request sent status when profile changes
      setRequestSent(false);
    } catch (err) {
      console.error("Error fetching profile:", err);
      if (err.response?.status === 404) navigate("/home");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (followLoading || isFollowing || requestSent) return;
    setFollowLoading(true);
    try {
      const res = await API.post(`/user/follow-request/${userId}`);
      setRequestSent(true);
      alert(res.data.msg || "Follow request sent!");
    } catch (err) {
      const msg = err.response?.data?.msg || "";
      if (msg.toLowerCase().includes("already following")) {
        setIsFollowing(true);
        setRequestSent(false);
      } else if (msg.toLowerCase().includes("already sent")) {
        setRequestSent(true);
      } else {
        console.error("Follow error:", err);
        alert(msg || "Failed to send follow request");
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setFollowLoading(true);
    try {
      // Make sure the URL matches your backend route
      const res = await API.delete(`/user/unfollow/${userId}`);
      // OR if you're using the toggle route:
      // const res = await API.post(`/user/toggle-follow/${userId}`);

      setIsFollowing(false);
      setFollowersCount((prev) => prev - 1);
      setRequestSent(false);
      alert("Unfollowed successfully");

      if (res.data.user) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.error("Unfollow error:", err);
      alert(err.response?.data?.msg || "Failed to unfollow");
    } finally {
      setFollowLoading(false);
      setShowUnfollowConfirm(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-emerald-500" size={36} />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-50">
        <p className="font-bold text-slate-600">User not found</p>
        <button
          onClick={() => navigate("/home")}
          className="text-sm text-emerald-500 underline"
        >
          Go Home
        </button>
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === userId;

  const avatarFallback = `https://ui-avatars.com/api/?background=10b981&color=fff&bold=true&size=80&name=${
    profileUser.username?.charAt(0) || "U"
  }`;

  // ── Follow button label ───────────────────────────────────────────────────────
  const followLabel = () => {
    if (followLoading) return <Loader2 size={13} className="animate-spin" />;
    if (isFollowing)
      return (
        <>
          <UserCheck size={13} /> Following
        </>
      );
    if (requestSent) return "Request Sent";
    return (
      <>
        <UserPlus size={13} /> Follow
      </>
    );
  };

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
        {/* ── Back ─────────────────────────────────────────────────────────── */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Unfollow Confirmation Modal */}
        {showUnfollowConfirm && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <UserMinus size={32} className="text-red-500" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">
                  Unfollow {profileUser.username}?
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  They won't know you unfollowed them. You can follow again
                  anytime.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowUnfollowConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUnfollow}
                    disabled={followLoading}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {followLoading ? (
                      <Loader2 size={16} className="animate-spin mx-auto" />
                    ) : (
                      "Unfollow"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PROFILE BANNER  (matches screenshot style exactly)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="relative mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Cover image */}
          <div className="relative h-36 w-full sm:h-44 md:h-52">
            {profileUser.coverImage ? (
              <img
                src={profileUser.coverImage}
                alt="cover"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-r from-emerald-600 to-teal-500" />
            )}
            {/* dark overlay so text is readable */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </div>

          {/* Profile info row — sits on the cover, bottom-aligned */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 sm:px-6 sm:pb-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              {/* Left: avatar + name + meta */}
              <div className="flex items-end gap-3 sm:gap-4">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="h-16 w-16 overflow-hidden rounded-full border-4 border-white shadow-lg sm:h-20 sm:w-20">
                    <img
                      src={profileUser.image || avatarFallback}
                      alt={profileUser.username}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.src = avatarFallback;
                      }}
                    />
                  </div>
                </div>

                {/* Name / email / bio */}
                <div className="pb-0.5">
                  <h1 className="text-base font-black text-white drop-shadow sm:text-lg md:text-xl">
                    {profileUser.username}
                  </h1>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-white/70">
                    <Mail size={9} />
                    <span className="max-w-[200px] truncate sm:max-w-none">
                      {profileUser.email}
                    </span>
                  </p>
                  {profileUser.bio && (
                    <p className="mt-1 max-w-md text-xs text-white/80 line-clamp-2">
                      {profileUser.bio}
                    </p>
                  )}

                  {/* Stats: stories · followers · following */}
                  <div className="mt-2 flex items-center gap-4 sm:gap-6">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-white sm:text-base">
                        {storiesCount}
                      </span>
                      <span className="text-[8px] uppercase tracking-wider text-white/60">
                        stories
                      </span>
                    </div>

                    <button
                      onClick={() => setFollowersModalOpen(true)}
                      className="flex flex-col items-center hover:opacity-75 transition-opacity"
                    >
                      <span className="text-sm font-bold text-white sm:text-base">
                        {followersCount}
                      </span>
                      <span className="text-[8px] uppercase tracking-wider text-white/60">
                        followers
                      </span>
                    </button>

                    <button
                      onClick={() => setFollowingModalOpen(true)}
                      className="flex flex-col items-center hover:opacity-75 transition-opacity"
                    >
                      <span className="text-sm font-bold text-white sm:text-base">
                        {followingCount}
                      </span>
                      <span className="text-[8px] uppercase tracking-wider text-white/60">
                        following
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Follow/Unfollow button (hidden on own profile) */}
              {!isOwnProfile && (
                <button
                  onClick={
                    isFollowing
                      ? () => setShowUnfollowConfirm(true)
                      : handleFollow
                  }
                  disabled={followLoading || (!isFollowing && requestSent)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-60 sm:px-5 sm:py-2 ${
                    isFollowing
                      ? "bg-slate-700 text-white hover:bg-slate-800"
                      : requestSent
                        ? "cursor-not-allowed bg-slate-400 text-white"
                        : "bg-emerald-500 text-white hover:bg-emerald-600"
                  }`}
                >
                  {followLabel()}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            STORIES GRID
        ══════════════════════════════════════════════════════════════════ */}
        <div>
          {/* Section header */}
          <div className="mb-4 flex items-center gap-2">
            <FileText size={16} className="text-emerald-500" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">
              Stories by {profileUser.username}
            </h2>
          </div>

          {stories.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-white py-16">
              <BookOpen size={36} className="mb-2 text-slate-200" />
              <p className="text-sm text-slate-400">No stories published yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
              {stories.map((story) => (
                <Link
                  key={story._id}
                  to={`/story/${story._id}`}
                  className="group overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[3/2] w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                    <img
                      src={
                        story.image ||
                        "https://images.unsplash.com/photo-1456327102063-fb5054efe647?w=400&h=225&fit=crop"
                      }
                      alt={story.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1456327102063-fb5054efe647?w=400&h=225&fit=crop";
                      }}
                    />
                    {/* Category badge */}
                    {story.category && (
                      <span className="absolute left-1.5 top-1.5 rounded bg-emerald-500 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white">
                        {story.category.slice(0, 6)}
                      </span>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-2.5">
                    <h4 className="truncate text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                      {story.title}
                    </h4>
                    {story.author && (
                      <p className="mt-0.5 truncate text-[10px] text-slate-400">
                        {story.author}
                      </p>
                    )}
                    {/* Stats */}
                    <div className="mt-1.5 flex items-center gap-2.5 text-[9px] text-slate-400">
                      <span className="flex items-center gap-0.5">
                        <Eye size={8} /> {story.views || 0}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <ThumbsUp size={8} /> {story.likes?.length || 0}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MessageCircle size={8} /> {story.comments?.length || 0}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Followers / Following modals ──────────────────────────────────── */}
        <FollowersModal
          isOpen={followersModalOpen}
          onClose={() => setFollowersModalOpen(false)}
          userId={userId}
          type="followers"
          title="Followers"
        />
        <FollowersModal
          isOpen={followingModalOpen}
          onClose={() => setFollowingModalOpen(false)}
          userId={userId}
          type="following"
          title="Following"
        />
      </div>
    </div>
  );
}
