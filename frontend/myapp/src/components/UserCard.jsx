// components/UserCard.jsx
import { Link } from "react-router-dom";
import { useState } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { UserPlus, UserCheck } from "lucide-react";

export default function UserCard({ user: userData, onFollowChange }) {
  const { user: currentUser, setUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(userData.isFollowing || false);
  const [loading, setLoading] = useState(false);

  const handleFollowToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) return;
    setLoading(true);
    
    try {
      if (isFollowing) {
        await API.delete(`/user/follow/${userData._id}`);
        setIsFollowing(false);
      } else {
        await API.post(`/user/follow/${userData._id}`);
        setIsFollowing(true);
      }
      
      // Refresh current user data
      const res = await API.get('/auth/me');
      setUser(res.data);
      
      if (onFollowChange) onFollowChange();
    } catch (err) {
      console.error("Follow error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Don't show current user in the list
  if (currentUser?._id === userData._id) return null;

  return (
    <Link 
      to={`/user/${userData._id}`}
      className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors rounded-xl group"
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-emerald-100 to-emerald-200 flex-shrink-0">
          <img
            src={userData.image || `https://ui-avatars.com/api/?background=10b981&color=fff&bold=true&size=48&name=${userData.username?.charAt(0) || 'U'}`}
            alt={userData.username}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm truncate group-hover:text-emerald-600 transition-colors">
            {userData.username}
          </p>
          {userData.bio && (
            <p className="text-xs text-slate-400 truncate">{userData.bio}</p>
          )}
          <p className="text-[10px] text-slate-400 mt-0.5">
            {userData.followers?.length || 0} followers
          </p>
        </div>
      </div>
      
      <button
        onClick={handleFollowToggle}
        disabled={loading}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${
          isFollowing
            ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
            : "bg-emerald-500 text-white hover:bg-emerald-600"
        }`}
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : isFollowing ? (
          "Following"
        ) : (
          "Follow"
        )}
      </button>
    </Link>
  );
}