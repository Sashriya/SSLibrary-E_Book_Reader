// components/SearchModal.jsx
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { X, Search, Loader2, UserPlus, UserCheck } from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function SearchModal({ isOpen, onClose }) {
  const { user: currentUser, setUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestedLoading, setSuggestedLoading] = useState(false);
  const [followingStatus, setFollowingStatus] = useState({});
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchSuggestedUsers();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchSuggestedUsers = async () => {
    setSuggestedLoading(true);
    try {
      const res = await API.get("/user/suggested");
      setSuggestedUsers(res.data);
      // Initialize following status
      const status = {};
      res.data.forEach(user => {
        status[user._id] = user.isFollowing || false;
      });
      setFollowingStatus(status);
    } catch (err) {
      console.error("Error fetching suggested users:", err);
    } finally {
      setSuggestedLoading(false);
    }
  };

  const searchUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/user/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data);
      // Update following status for search results
      const status = { ...followingStatus };
      res.data.forEach(user => {
        status[user._id] = user.isFollowing || false;
      });
      setFollowingStatus(status);
    } catch (err) {
      console.error("Error searching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (userId, isCurrentlyFollowing) => {
    try {
      if (isCurrentlyFollowing) {
        await API.delete(`/user/follow/${userId}`);
        setFollowingStatus(prev => ({ ...prev, [userId]: false }));
      } else {
        await API.post(`/user/follow/${userId}`);
        setFollowingStatus(prev => ({ ...prev, [userId]: true }));
      }
      
      // Refresh current user data
      const res = await API.get('/auth/me');
      setUser(res.data);
      
      // Refresh suggested users
      fetchSuggestedUsers();
    } catch (err) {
      console.error("Error toggling follow:", err);
    }
  };

  const UserCard = ({ user }) => {
    const isFollowing = followingStatus[user._id] || false;
    
    return (
      <div className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors rounded-xl group">
        <Link 
          to={`/user/${user._id}`} 
          onClick={onClose}
          className="flex items-center gap-3 flex-1"
        >
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-emerald-100 to-emerald-200 flex-shrink-0">
            <img
              src={user.image || `https://ui-avatars.com/api/?background=10b981&color=fff&bold=true&size=48&name=${user.username?.charAt(0) || 'U'}`}
              alt={user.username}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate group-hover:text-emerald-600 transition-colors">
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
        
        <button
          onClick={() => handleFollowToggle(user._id, isFollowing)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${
            isFollowing
              ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
              : "bg-emerald-500 text-white hover:bg-emerald-600"
          }`}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/50 backdrop-blur-sm pt-16 sm:pt-20">
      <div className="w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-lg font-black text-slate-800">Search Users</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[450px] overflow-y-auto">
          {searchQuery.trim().length > 0 ? (
            // Search Results
            loading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={24} className="animate-spin text-emerald-500" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12">
                <Search size={40} className="mx-auto text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">No users found for "{searchQuery}"</p>
              </div>
            ) : (
              searchResults.map((user) => (
                <UserCard key={user._id} user={user} />
              ))
            )
          ) : (
            // Suggested Users
            <>
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                <p className="text-xs font-bold uppercase text-slate-400">Suggested for you</p>
              </div>
              {suggestedLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-emerald-500" />
                </div>
              ) : suggestedUsers.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus size={40} className="mx-auto text-slate-200 mb-2" />
                  <p className="text-sm text-slate-400">No suggestions available</p>
                </div>
              ) : (
                suggestedUsers.map((user) => (
                  <UserCard key={user._id} user={user} />
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}