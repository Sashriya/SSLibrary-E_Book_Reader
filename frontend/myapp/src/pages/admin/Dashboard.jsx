import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { CheckCircle, Clock, BarChart3, Plus } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const res = await API.get("/admin/stories");
        if (!isMounted) return;
        const all = res.data || [];
        setStats({
          total: all.length,
          published: all.filter(s => s.status === 'published').length,
          drafts: all.filter(s => s.status === 'draft').length
        });
      } catch (err) {
        console.error("Dashboard stats error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStats();
    return () => { isMounted = false; };
  }, []);

  const StatCard = ({ icon, label, value, color, bgColor }) => (
    <div className={`rounded-[35px] p-8 shadow-2xl ${bgColor}`}>
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${color === 'emerald' ? 'bg-white/10' : 'bg-emerald-50'}`}>
        {icon}
      </div>
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</h3>
      <p className={`mt-1 text-5xl font-black tracking-tighter ${color === 'emerald' ? 'text-white' : 'text-slate-900'}`}>
        {loading ? "—" : value}
      </p>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 animate-in fade-in duration-700">
      <header className="mb-12">
        <h2 className="text-4xl font-black tracking-tighter text-slate-900">
          Admin <span className="text-emerald-500">Command Center</span>
        </h2>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Platform Overview & Statistics</p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard icon={<BarChart3 size={24} className="text-emerald-400" />} label="Total Manuscripts" value={stats.total} color="emerald" bgColor="bg-slate-900" />
        <StatCard icon={<CheckCircle size={24} className="text-emerald-500" />} label="Live Published" value={stats.published} color="slate" bgColor="bg-white border border-slate-100" />
        <StatCard icon={<Clock size={24} className="text-amber-500" />} label="Pending Drafts" value={stats.drafts} color="slate" bgColor="bg-white border border-slate-100" />
      </div>

      <div className="mt-12 rounded-[40px] bg-emerald-500 p-10 text-white flex flex-col md:flex-row items-center justify-between">
        <div>
          <h3 className="text-2xl font-black tracking-tight">Ready to add more magic?</h3>
          <p className="font-bold opacity-80">Continue your writing journey today.</p>
        </div>
        <button onClick={() => navigate("/admin/write")}
          className="mt-6 md:mt-0 flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-xs font-black uppercase tracking-widest text-emerald-600 shadow-xl transition-all hover:-translate-y-1 active:scale-95">
          <Plus size={16} /> Create New Story
        </button>
      </div>
    </div>
  );
}