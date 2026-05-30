import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import { Heart, ArrowRight, Loader2, BookOpen, CheckCircle, MessageCircle, ThumbsUp, Eye } from "lucide-react";

export default function StoryCard({ story }) {
  const { user, setUser } = useAuth();
  const [favLoading, setFavLoading] = useState(false);
  const [likesCount, setLikesCount] = useState(story.likes?.length || 0);
  const [commentsCount, setCommentsCount] = useState(story.comments?.length || 0);
  const [viewsCount, setViewsCount] = useState(story.views || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [loadingLikes, setLoadingLikes] = useState(false);

  const storyId = story._id?.toString();

  // Check if user liked this story
  useEffect(() => {
    const checkIfLiked = async () => {
      if (user && storyId) {
        try {
          const res = await API.get(`/user/story/${storyId}/interactions`);
          setIsLiked(res.data.isLiked);
          setLikesCount(res.data.likes);
          setCommentsCount(res.data.totalComments);
        } catch (err) {
          console.error("Error fetching interactions:", err);
        }
      }
    };
    checkIfLiked();
  }, [storyId, user]);

  // Fetch latest views count
  useEffect(() => {
    const fetchViews = async () => {
      try {
        const res = await API.get(`/user/story/${storyId}/views`);
        setViewsCount(res.data.views);
      } catch (err) {
        setViewsCount(story.views || 0);
      }
    };
    if (storyId) {
      fetchViews();
    }
  }, [storyId, story.views]);

  const isFavorite = user?.favorites?.some(
    (f) => f?.toString() === storyId
  );

  const isReading = user?.reading?.some(
    (r) => r?.toString() === storyId
  );

  const isCompleted = user?.completed?.some(
    (c) => c?.toString() === storyId
  );

  const handleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return alert("Please login to add favorites! ❤️");

    setFavLoading(true);
    try {
      const res = await API.post(`/user/favorites/${story._id}`);
      if (res.data) setUser(res.data);
    } catch (err) {
      console.error("FAVORITE ERROR:", err.response?.data || err.message);
    } finally {
      setFavLoading(false);
    }
  };

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return alert("Please login to like stories! 👍");

    setLoadingLikes(true);
    try {
      const res = await API.post(`/user/story/${story._id}/like`);
      setIsLiked(res.data.isLiked);
      setLikesCount(res.data.likes);
    } catch (err) {
      console.error("Like error:", err);
      alert("Failed to like story");
    } finally {
      setLoadingLikes(false);
    }
  };

  const showCompleted = isCompleted;
  const showReading = !isCompleted && isReading;

  return (
    <div className="group relative flex w-full flex-col overflow-hidden rounded-[25px] border border-slate-100 bg-white transition-all duration-500 hover:-translate-y-2 hover:border-emerald-200 hover:shadow-2xl">
      
      {/* Cover Image - LANDSCAPE (16:9 or 4:3 aspect ratio) */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        <img
          src={story.image || "https://images.unsplash.com/photo-1456327102063-fb5054efe647?w=800&h=450&fit=crop"}
          alt={story.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Views Badge - Top Left */}
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[8px] font-black uppercase text-white shadow-lg">
          <Eye size={10} />
          <span>{viewsCount}</span>
        </div>

        {/* Status Badges */}
        {showCompleted && (
          <div className="absolute left-3 top-12 z-10 flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[8px] font-black uppercase text-white shadow-lg">
            <CheckCircle size={9} /> Completed
          </div>
        )}
        {showReading && (
          <div className="absolute left-3 top-12 z-10 flex items-center gap-1 rounded-full bg-blue-500 px-2.5 py-1 text-[8px] font-black uppercase text-white shadow-lg">
            <BookOpen size={9} /> Reading
          </div>
        )}

        {/* Favorite Button */}
        <div className="absolute right-3 top-3 z-10 opacity-0 translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
          <button
            onClick={handleFavorite}
            disabled={favLoading}
            className={`rounded-xl p-2 backdrop-blur-md border shadow-lg transition-all active:scale-90 ${
              isFavorite
                ? 'bg-rose-500 text-white border-rose-400'
                : 'bg-white/80 text-slate-400 border-white/40 hover:text-rose-500 hover:bg-white'
            }`}
          >
            {favLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Heart size={16} fill={isFavorite ? "white" : "none"} />
            )}
          </button>
        </div>
      </div>

      {/* Card Body - Compact */}
      <div className="flex flex-col p-4 text-left">
        
        {/* Category and Author Row */}
        <div className="mb-2 flex items-center justify-between text-[9px] font-black uppercase tracking-wider">
          <span className="text-emerald-500">{story.category || "General"}</span>
          <span className="text-slate-400 truncate max-w-[120px]">By {story.author || "Unknown"}</span>
        </div>

        {/* Title - 2 lines max */}
        <h3 className="line-clamp-2 text-base font-black leading-tight tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors min-h-[2.5rem]">
          {story.title}
        </h3>

        {/* Stats Row - Compact */}
        <div className="mt-3 flex items-center gap-3 text-[10px] font-bold">
          <button 
            onClick={handleLike}
            disabled={loadingLikes}
            className={`flex items-center gap-1 transition-all hover:scale-110 ${
              isLiked ? 'text-blue-500' : 'text-slate-400 hover:text-blue-500'
            }`}
          >
            {loadingLikes ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <ThumbsUp size={12} fill={isLiked ? "currentColor" : "none"} />
            )}
            <span>{likesCount}</span>
          </button>
          
          <div className="flex items-center gap-1 text-slate-400">
            <MessageCircle size={12} />
            <span>{commentsCount}</span>
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            <Eye size={12} />
            <span>{viewsCount}</span>
          </div>
        </div>

        {/* Action Link */}
        <div className="mt-3 border-t border-slate-50 pt-3">
          {showCompleted ? (
            <Link to={`/story/${story._id}`}
              className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-emerald-500 hover:text-emerald-600 transition-all group/btn">
              <span className="flex items-center gap-1"><CheckCircle size={11} /> Read Again</span>
              <ArrowRight size={13} className="transition-transform group-hover/btn:translate-x-1" />
            </Link>
          ) : showReading ? (
            <Link to={`/story/${story._id}`}
              className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-blue-500 hover:text-blue-600 transition-all group/btn">
              <span className="flex items-center gap-1"><BookOpen size={11} /> Continue</span>
              <ArrowRight size={13} className="transition-transform group-hover/btn:translate-x-1" />
            </Link>
          ) : (
            <Link to={`/story/${story._id}`}
              className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-600 hover:text-emerald-500 transition-all group/btn">
              <span>Start Reading</span>
              <ArrowRight size={13} className="transition-transform group-hover/btn:translate-x-1" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}