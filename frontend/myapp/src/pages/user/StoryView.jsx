import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import {
  CheckCircle,
  BookOpen,
  ChevronLeft,
  Clock,
  User,
  Loader2,
  BookmarkCheck,
  ThumbsUp,
  MessageCircle,
  Send,
  Trash2,
  Eye
} from "lucide-react";

export default function StoryView() {
  const { id } = useParams();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [addingToReading, setAddingToReading] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deletingComment, setDeletingComment] = useState(false);
  const [loadingInteractions, setLoadingInteractions] = useState(true);
  const commentsEndRef = useRef(null);
  
  const [status, setStatus] = useState({
    isReading: false,
    isCompleted: false
  });

  // Helper functions for avatar
  const getUserInitial = (username) => {
    if (!username) return "U";
    return username.charAt(0).toUpperCase();
  };

  const getAvatarColor = (username) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500', 'bg-rose-500', 'bg-violet-500'
    ];
    if (!username) return colors[0];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Scroll to bottom when new comment added
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  useEffect(() => {
    const fetchStoryAndSync = async () => {
      setLoading(true);
      try {
        // TRACK VIEW
        try {
          await API.post(`/user/story/${id}/view`);
          console.log("View tracked for story:", id);
        } catch (viewErr) {
          console.error("View tracking error:", viewErr);
        }

        const res = await API.get(`/stories/${id}`);
        setStory(res.data);

        if (!user) {
          setLoading(false);
          return;
        }

        const storyId = id;
        const completedIds = (user.completed || []).map((c) => c?.toString());
        const readingIds = (user.reading || []).map((r) => r?.toString());

        const isCompleted = completedIds.includes(storyId);
        const isReading = readingIds.includes(storyId);

        if (isCompleted) {
          setStatus({ isReading: false, isCompleted: true });
        } else if (isReading) {
          setStatus({ isReading: true, isCompleted: false });
        } else if (!isReading && !isCompleted) {
          setAddingToReading(true);
          try {
            const updateRes = await API.post(`/user/reading/${id}`);
            if (updateRes.data) {
              setUser(updateRes.data);
              setStatus({ isReading: true, isCompleted: false });
            }
          } catch (err) {
            console.error("Reading add failed:", err);
          } finally {
            setAddingToReading(false);
          }
        }

        await fetchInteractions();
      } catch (err) {
        console.error("Story fetch error:", err);
        if (err.response?.status === 404) {
          alert("Story not found!");
          navigate("/home");
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchInteractions = async () => {
      if (!user) return;
      setLoadingInteractions(true);
      try {
        const res = await API.get(`/user/story/${id}/interactions`);
        setIsLiked(res.data.isLiked);
        setLikesCount(res.data.likes);
        setComments(res.data.comments || []);
      } catch (err) {
        console.error("Fetch interactions error:", err);
      } finally {
        setLoadingInteractions(false);
      }
    };

    if (id) {
      fetchStoryAndSync();
    }
  }, [id, user?._id ?? user?.id]);

  const handleLike = async () => {
    if (!user) {
      alert("Please login to like stories! 👍");
      return;
    }
    
    try {
      const res = await API.post(`/user/story/${id}/like`);
      setIsLiked(res.data.isLiked);
      setLikesCount(res.data.likes);
    } catch (err) {
      console.error("Like error:", err);
      alert("Failed to like story");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to comment! 💬");
      return;
    }
    if (!newComment.trim()) {
      alert("Please enter a comment");
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await API.post(`/user/story/${id}/comment`, { text: newComment });
      
      // Add the new comment to the list
      if (res.data.comment) {
        setComments([res.data.comment, ...comments]);
        setNewComment("");
      }
    } catch (err) {
      console.error("Comment error:", err);
      alert(err.response?.data?.msg || "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    
    setDeletingComment(true);
    try {
      await API.delete(`/user/story/${id}/comment/${commentId}`);
      setComments(prev => prev.filter(c => c._id !== commentId));
      alert("Comment deleted successfully!");
    } catch (err) {
      console.error("Delete comment error:", err);
      alert(err.response?.data?.msg || "Failed to delete comment");
    } finally {
      setDeletingComment(false);
    }
  };

  const handleMarkComplete = async () => {
    if (markingComplete) return;
    setMarkingComplete(true);
    try {
      const res = await API.post(`/user/complete/${id}`);
      if (res.data) {
        setUser(res.data);
        setStatus({ isReading: false, isCompleted: true });
      }
    } catch (err) {
      console.error("Complete error:", err.response?.data || err.message);
      if (err.response?.status >= 400) {
        alert(err.response?.data?.msg || "Status update failed. Try again.");
      }
    } finally {
      setMarkingComplete(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-emerald-500" size={40} />
      <p className="font-black uppercase text-slate-400 tracking-widest">Opening Manuscript...</p>
    </div>
  );

  if (!story) return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 px-4">
      <p className="font-black uppercase text-slate-400 text-center">Story not found.</p>
      <button onClick={() => navigate(-1)} className="text-emerald-500 underline text-sm font-bold">
        Go Back
      </button>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-10">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors"
      >
        <ChevronLeft size={18} /> Back to Library
      </button>

      {/* Main Content - Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        
        {/* LEFT COLUMN - Cover and Info */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            
            {/* Cover Image */}
            <div className="rounded-2xl overflow-hidden shadow-lg bg-slate-100">
              <img
                src={story?.image || "https://via.placeholder.com/400x600?text=No+Cover"}
                className="w-full aspect-[3/4] object-cover"
                alt={story?.title}
              />
            </div>

            {/* Info Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
              
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-slate-400">Genre</span>
                <span className="text-sm font-bold text-emerald-600">{story?.category}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-xs font-bold uppercase text-slate-400">Total Views</span>
                <span className="flex items-center gap-1 text-sm font-bold text-slate-700">
                  <Eye size={14} /> {story?.views || 0}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-slate-400">Status</span>
                {status.isCompleted ? (
                  <span className="flex items-center gap-1 text-sm font-bold text-emerald-600">
                    <CheckCircle size={14} /> Completed
                  </span>
                ) : status.isReading ? (
                  <span className="flex items-center gap-1 text-sm font-bold text-blue-600">
                    <BookOpen size={14} /> Reading
                  </span>
                ) : (
                  <span className="text-sm text-slate-400">Not Started</span>
                )}
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleLike} 
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    isLiked 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-slate-100 text-slate-700 hover:bg-blue-100'
                  }`}
                >
                  <ThumbsUp size={16} fill={isLiked ? "white" : "none"} />
                  {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
                </button>
              </div>

              {status.isReading && !status.isCompleted && (
                <button 
                  onClick={handleMarkComplete} 
                  disabled={markingComplete}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {markingComplete ? <Loader2 size={16} className="animate-spin" /> : <BookmarkCheck size={16} />}
                  {markingComplete ? "Saving..." : "Mark as Complete"}
                </button>
              )}

              {status.isCompleted && (
                <div className="w-full py-3 rounded-xl bg-emerald-50 text-center text-sm font-bold text-emerald-600 border border-emerald-100">
                  ✓ Read Successfully
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Content and Comments */}
        <div className="lg:col-span-2">
          
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 leading-tight">
            {story?.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 pb-6 mb-6 border-b border-slate-100">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <User size={14} className="text-emerald-500" />
              <span className="font-medium">{story?.author}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock size={14} />
              <span>{Math.ceil((story?.content?.length || 0) / 1000)} min read</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <MessageCircle size={14} className="text-emerald-500" />
              <span>{comments.length} comments</span>
            </div>
          </div>

          {/* Story Content */}
          <div className="prose prose-slate max-w-none mb-10">
            <div className="font-serif text-base sm:text-lg leading-relaxed text-slate-700 whitespace-pre-line">
              {story?.content}
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <MessageCircle size={22} className="text-emerald-500" />
              Comments ({comments.length})
            </h3>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="mb-6 flex gap-3">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
              <button 
                type="submit" 
                disabled={submittingComment || !newComment.trim()}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                {submittingComment ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>

            {/* Comments List */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle size={40} className="mx-auto text-slate-200 mb-2" />
                  <p className="text-sm text-slate-400">No comments yet. Start the conversation!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="group bg-slate-50 rounded-xl p-4 transition-all hover:bg-slate-100">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0 ${getAvatarColor(comment.user?.username)}`}>
                        {getUserInitial(comment.user?.username)}
                      </div>
                      
                      {/* Comment Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-slate-800 text-sm">{comment.user?.username}</span>
                          <span className="text-xs text-slate-400">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                          {comment.user?.id === user?._id && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">You</span>
                          )}
                          {comment.user?.username === story?.author && (
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Author</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-700">{comment.text}</p>
                      </div>
                      
                      {/* Delete Button */}
                      {(comment.user?.id === user?._id || user?.role === 'admin') && (
                        <button 
                          onClick={() => handleDeleteComment(comment._id)}
                          disabled={deletingComment}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                          title="Delete comment"
                        >
                          {deletingComment ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>
          </div>

          {/* Bottom Action Buttons */}
          {status.isReading && !status.isCompleted && (
            <div className="mt-8 text-center">
              <button
                onClick={handleMarkComplete}
                disabled={markingComplete}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {markingComplete ? <Loader2 size={18} className="animate-spin" /> : <BookmarkCheck size={18} />}
                {markingComplete ? "Saving..." : "I Finished Reading This Story"}
              </button>
            </div>
          )}

          {status.isCompleted && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
                <CheckCircle size={18} />
                You have completed this story! 🎉
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}