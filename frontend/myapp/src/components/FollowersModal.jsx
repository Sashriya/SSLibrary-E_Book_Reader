// components/FollowersModal.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Loader2, UserPlus, UserCheck, UserMinus } from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function FollowersModal({ isOpen, onClose, userId, type, title }) {
  const { user: currentUser, setUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingStatus, setFollowingStatus] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (isOpen && userId) {
      fetchUsers();
    }
  }, [isOpen, userId, type]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const endpoint = type === 'followers' 
        ? `/user/followers/${userId}` 
        : `/user/following/${userId}`;
      const res = await API.get(endpoint);
      setUsers(res.data);
      
      const status = {};
      res.data.forEach(user => {
        status[user._id] = user.isFollowing || false;
      });
      setFollowingStatus(status);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (targetUserId, isCurrentlyFollowing) => {
    if (actionLoading[targetUserId]) return;
    
    setActionLoading(prev => ({ ...prev, [targetUserId]: true }));
    try {
      if (isCurrentlyFollowing) {
        // Unfollow
        await API.delete(`/user/unfollow/${targetUserId}`);
        setFollowingStatus(prev => ({ ...prev, [targetUserId]: false }));
      } else {
        // Follow
        await API.post(`/user/follow/${targetUserId}`);
        setFollowingStatus(prev => ({ ...prev, [targetUserId]: true }));
      }
      
      // Refresh current user data
      const res = await API.get('/auth/me');
      setUser(res.data);
      
      // Refresh the list
      await fetchUsers();
    } catch (err) {
      console.error("Error toggling follow:", err);
      alert(err.response?.data?.msg || "Failed to update follow status");
    } finally {
      setActionLoading(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  const UserCard = ({ user }) => {
    const isFollowing = followingStatus[user._id] || false;
    const isLoading = actionLoading[user._id];
    const isCurrentUser = currentUser?._id === user._id;

    return (
      <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-xl border-b border-slate-50 last:border-0">
        <Link 
          to={`/user/${user._id}`} 
          onClick={onClose}
          className="flex items-center gap-3 flex-1"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gradient-to-br from-emerald-100 to-emerald-200 flex-shrink-0">
            <img
              src={user.image || `https://ui-avatars.com/api/?background=10b981&color=fff&bold=true&size=48&name=${user.username?.charAt(0) || 'U'}`}
              alt={user.username}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate group-hover:text-emerald-600">
              {user.username}
            </p>
            {user.bio && (
              <p className="text-xs text-slate-400 truncate">{user.bio}</p>
            )}
            <p className="text-[10px] text-slate-400 mt-0.5">
              {user.followersCount || 0} followers
            </p>
          </div>
        </Link>
        
        {!isCurrentUser && (
          <button
            onClick={() => handleFollowToggle(user._id, isFollowing)}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors min-w-[70px] ${
              isFollowing
                ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                : "bg-emerald-500 text-white hover:bg-emerald-600"
            } disabled:opacity-50`}
          >
            {isLoading ? (
              <Loader2 size={12} className="animate-spin mx-auto" />
            ) : isFollowing ? (
              "Following"
            ) : (
              "Follow"
            )}
          </button>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white">
          <h3 className="text-lg font-black text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[450px] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-emerald-500" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus size={40} className="mx-auto text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">No {type} yet</p>
            </div>
          ) : (
            users.map((user) => (
              <UserCard key={user._id} user={user} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}