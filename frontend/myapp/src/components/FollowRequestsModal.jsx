// components/FollowRequestsModal.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Loader2, UserPlus, Check, XCircle, UserCheck } from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function FollowRequestsModal({ isOpen, onClose }) {
  const { user, setUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await API.get("/user/follow-requests/pending");
      setRequests(res.data);
    } catch (err) {
      console.error("Error fetching follow requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requesterId) => {
    setActionLoading(prev => ({ ...prev, [requesterId]: true }));
    try {
      const res = await API.put(`/user/follow-request/${requesterId}/accept`);
      if (res.data.user) {
        setUser(res.data.user);
      }
      // Remove from list
      setRequests(prev => prev.filter(req => req.from._id !== requesterId));
      alert("Follow request accepted!");
    } catch (err) {
      console.error("Error accepting request:", err);
      alert(err.response?.data?.msg || "Failed to accept request");
    } finally {
      setActionLoading(prev => ({ ...prev, [requesterId]: false }));
    }
  };

  const handleReject = async (requesterId) => {
    setActionLoading(prev => ({ ...prev, [requesterId]: true }));
    try {
      await API.delete(`/user/follow-request/${requesterId}/reject`);
      setRequests(prev => prev.filter(req => req.from._id !== requesterId));
      alert("Follow request rejected");
    } catch (err) {
      console.error("Error rejecting request:", err);
      alert(err.response?.data?.msg || "Failed to reject request");
    } finally {
      setActionLoading(prev => ({ ...prev, [requesterId]: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white">
          <h3 className="text-lg font-black text-slate-800">Follow Requests</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[450px] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-emerald-500" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus size={40} className="mx-auto text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">No pending follow requests</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {requests.map((request) => (
                <div key={request._id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <Link 
                    to={`/user/${request.from._id}`} 
                    onClick={onClose}
                    className="flex items-center gap-3 flex-1"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-emerald-100 to-emerald-200 flex-shrink-0">
                      <img
                        src={request.from.image || `https://ui-avatars.com/api/?background=10b981&color=fff&bold=true&size=48&name=${request.from.username?.charAt(0) || 'U'}`}
                        alt={request.from.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">
                        {request.from.username}
                      </p>
                      {request.from.bio && (
                        <p className="text-xs text-slate-400 truncate">{request.from.bio}</p>
                      )}
                    </div>
                  </Link>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAccept(request.from._id)}
                      disabled={actionLoading[request.from._id]}
                      className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                      title="Accept"
                    >
                      {actionLoading[request.from._id] ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Check size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(request.from._id)}
                      disabled={actionLoading[request.from._id]}
                      className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                      title="Reject"
                    >
                      {actionLoading[request.from._id] ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <XCircle size={16} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}