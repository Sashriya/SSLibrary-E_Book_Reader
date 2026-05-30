import { Link, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function AdminLayout() {
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/admin/write", label: "Write Story", icon: "🖋️" },
    { path: "/admin/manage", label: "Manage Content", icon: "📚" },
  ];

  const isActive = (path) => pathname === path || pathname.startsWith(path + "/");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="fixed h-screen w-72 flex-col bg-slate-900 p-10 text-white hidden md:flex">
        <div className="mb-12">
          <Link to="/" className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 hover:text-emerald-400">
            ← Back to Site
          </Link>
          <h2 className="mt-5 text-3xl font-black tracking-tighter">
            Control <span className="text-emerald-500">Center</span>
          </h2>
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} 
              className={`flex items-center gap-3 rounded-xl px-5 py-4 text-sm font-bold transition-all duration-300 ${
                isActive(item.path) ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}>
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
        <h2 className="text-xl font-black tracking-tighter">Control <span className="text-emerald-500">Center</span></h2>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900 pt-20 px-5">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-5 py-4 text-sm font-bold ${isActive(item.path) ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <span>{item.icon}</span> {item.label}
              </Link>
            ))}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-[10px] font-black uppercase text-emerald-500">← Back to Site</Link>
            </div>
          </nav>
        </div>
      )}

      <main className="flex-1 p-8 md:ml-72 lg:p-12 pt-20 md:pt-8">
        <div className="mx-auto max-w-6xl"><Outlet /></div>
      </main>
    </div>
  );
}