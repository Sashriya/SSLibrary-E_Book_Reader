// components/NotificationBell.jsx
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Bell, Heart, MessageCircle, UserPlus, X, Trash2, BookOpen, CheckCheck } from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

// ─── Translate old Tamil messages to English on the fly ──────────────────────
const toEnglishMessage = (message = "", senderUsername = "") => {
  if (!message) return "";

  // Strip leading "username " from the stored message so we don't double-show it
  const withoutUsername = message.startsWith(senderUsername + " ")
    ? message.slice(senderUsername.length + 1)
    : message;

  // Tamil → English replacements for legacy stored messages
  const translations = {
    "உங்கள் கதையை": "liked your story",
    "விரும்பினார்": "",
    "உங்கள் கதையில்": "commented on your story",
    "கருத்து இட்டார்": "",
    "உங்களை பின்தொடர்கிறார்": "started following you",
    "புதிய கதை எழுதினார்:": "published a new story:",
    "புதிய கதை வெளியிட்டார்:": "published a new story:",
  };

  let result = withoutUsername;
  for (const [tamil, english] of Object.entries(translations)) {
    result = result.replaceAll(tamil, english);
  }

  result = result.replace(/\s{2,}/g, " ").trim();
  result = result.replace(/^"(.*)"$/, '$1');

  return result;
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [isOpen, setIsOpen]               = useState(false);
  const [loading, setLoading]             = useState(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await API.get("/user/notifications/unread-count");
      setUnreadCount(res.data.count);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await API.get("/user/notifications?page=1&limit=50");
      if (res.data?.notifications) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.notifications.filter((n) => !n.read).length);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) fetchNotifications();
  };

  const markAsRead = async (notificationId) => {
    try {
      await API.put(`/user/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put("/user/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const handleDelete = async (e, notificationId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await API.delete(`/user/notifications/${notificationId}`);
      const wasUnread = notifications.find((n) => n._id === notificationId && !n.read);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const clearAll = async () => {
    if (!window.confirm("Delete all notifications?")) return;
    try {
      await Promise.allSettled(
        notifications.map((n) => API.delete(`/user/notifications/${n._id}`))
      );
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "follow":
      case "follow_request":
      case "follow_accepted":
        return <UserPlus size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" />;
      case "like":
        return <Heart size={13} className="text-red-500 flex-shrink-0 mt-0.5" />;
      case "comment":
        return <MessageCircle size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />;
      case "story_published":
        return <BookOpen size={13} className="text-purple-500 flex-shrink-0 mt-0.5" />;
      default:
        return <Bell size={13} className="text-slate-400 flex-shrink-0 mt-0.5" />;
    }
  };

  const getLink = (n) => {
    if (n.type === "follow" || n.type === "follow_request" || n.type === "follow_accepted") {
      return `/user/${n.sender?._id}`;
    }
    if (n.type === "like" || n.type === "comment" || n.type === "story_published") {
      return `/story/${n.storyId?._id || n.storyId}`;
    }
    return "#";
  };

  const formatTime = (date) => {
    const diffMs   = Date.now() - new Date(date);
    const diffMins  = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays  = Math.floor(diffMs / 86_400_000);

    if (diffMins < 1)   return "Just now";
    if (diffMins < 60)  return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7)   return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  // Calculate position based on screen width
  const getDropdownPosition = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      // Mobile: center the dropdown
      return 'left-1/2 -translate-x-1/2';
    }
    // Desktop: align to right
    return 'right-0';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown - Responsive positioning */}
      {isOpen && (
        <div 
          className={`absolute ${getDropdownPosition()} mt-2 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden`}
          style={{ maxWidth: 'calc(100vw - 2rem)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white">
            <h3 className="font-black text-slate-800 text-sm">Notifications</h3>
            <div className="flex items-center gap-3">
              {notifications.some((n) => !n.read) && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  <CheckCheck size={12} />
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={12} />
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell size={36} className="mx-auto text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const senderUsername = n.sender?.username || "";
                const cleanMessage = toEnglishMessage(n.message, senderUsername);

                return (
                  <Link
                    key={n._id}
                    to={getLink(n)}
                    onClick={() => {
                      if (!n.read) markAsRead(n._id);
                      setIsOpen(false);
                    }}
                    className={`group flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${
                      !n.read ? "bg-emerald-50/40" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-emerald-100 to-emerald-200 ring-2 ring-white">
                      <img
                        src={
                          n.sender?.image ||
                          `https://ui-avatars.com/api/?background=10b981&color=fff&bold=true&size=36&name=${senderUsername.charAt(0) || "U"}`
                        }
                        alt={senderUsername}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?background=10b981&color=fff&bold=true&size=36&name=${senderUsername.charAt(0) || "U"}`;
                        }}
                      />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-1.5">
                        {getIcon(n.type)}
                        <p className="text-xs text-slate-700 leading-snug">
                          <span className="font-bold text-slate-900">{senderUsername}</span>
                          {cleanMessage && (
                            <span className="font-normal"> {cleanMessage}</span>
                          )}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 ml-5">
                        {formatTime(n.createdAt)}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!n.read && (
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-1" />
                    )}

                    {/* Delete button — visible on hover */}
                    <button
                      onClick={(e) => handleDelete(e, n._id)}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                      aria-label="Delete notification"
                    >
                      <X size={12} />
                    </button>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}