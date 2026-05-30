import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import { Edit3, Trash2, Eye, CheckCircle, Clock, AlertTriangle } from "lucide-react";

export default function ManageStories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStories = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await API.get("/admin/stories");
      setStories(res.data || []);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load stories");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStories(); }, [fetchStories]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this manuscript?")) return;
    try {
      await API.delete(`/stories/${id}`);
      setStories(prev => prev.filter(s => s._id !== id));
    } catch (err) { alert(err.response?.data?.msg || "Delete failed"); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div></div>;
  if (error) return <div className="flex h-screen flex-col items-center justify-center gap-4"><AlertTriangle size={40} className="text-red-500" /><p className="font-black text-slate-400">{error}</p><button onClick={fetchStories} className="text-emerald-500 underline">Retry</button></div>;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 animate-in fade-in duration-700">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Manage <span className="text-emerald-500">Manuscripts</span></h2>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Control your published and draft works</p>
        </div>
        <Link to="/admin/write" className="rounded-2xl bg-slate-900 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-600 transition-all">+ Write New</Link>
      </div>

      {stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-black text-slate-300 uppercase tracking-widest">No manuscripts found</p>
          <Link to="/admin/write" className="mt-4 text-emerald-500 underline text-xs font-bold">Create your first story</Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[35px] border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-50 bg-slate-50/50">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Story Info</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stories.map((story) => (
                  <tr key={story._id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <img src={story.image || "https://via.placeholder.com/100x150?text=No+Cover"} className="h-12 w-10 rounded-lg object-cover shadow-sm" alt={story.title} onError={(e) => { e.target.src = "https://via.placeholder.com/100x150?text=No+Cover"; }} />
                        <div>
                          <h4 className="font-black text-slate-800 leading-tight">{story.title}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">By {story.author}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6"><span className="rounded-lg bg-slate-100 px-3 py-1 text-[10px] font-black uppercase text-slate-500">{story.category || "General"}</span></td>
                    <td className="px-8 py-6">
                      {story.status === 'published' ? (
                        <div className="flex items-center gap-1.5 text-emerald-500"><CheckCircle size={14} /><span className="text-[10px] font-black uppercase tracking-widest">Published</span></div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-500"><Clock size={14} /><span className="text-[10px] font-black uppercase tracking-widest">Draft</span></div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <Link to={`/admin/edit/${story._id}`} className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={16} /></Link>
                        <button onClick={() => handleDelete(story._id)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16} /></button>
                        <Link to={`/story/${story._id}`} className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white transition-all"><Eye size={16} /></Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}