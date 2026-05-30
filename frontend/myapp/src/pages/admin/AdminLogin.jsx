import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function AdminLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!email.trim()) { setErrorMsg("Email is required"); return; }
    if (!validateEmail(email)) { setErrorMsg("Please enter a valid email address"); return; }
    if (!password) { setErrorMsg("Password is required"); return; }

    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setErrorMsg(err.response?.data?.msg || "Login failed. Check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-slate-900 font-sans">
      <div className="absolute -left-24 -top-24 h-[400px] w-[400px] rounded-full bg-emerald-500/15 blur-[100px]"></div>
      <div className="absolute -bottom-12 -right-12 h-[300px] w-[300px] rounded-full bg-orange-500/10 blur-[100px]"></div>

      <div className="z-10 w-full max-w-[420px] rounded-[40px] border border-white/10 bg-white/[0.03] p-12 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in duration-500">
        <header className="mb-10 text-center">
          <h1 className="text-2xl font-black tracking-tighter text-white">
            TAMIL <span className="text-emerald-500">STORIES</span>
          </h1>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Internal Management Portal</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input type="email" placeholder="admin@example.com"
                className="w-full rounded-2xl border border-slate-700 bg-slate-800/50 p-4 pl-12 text-sm text-white placeholder-slate-600 outline-none transition-all focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Security Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input type={showPassword ? "text" : "password"} placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-700 bg-slate-800/50 p-4 pl-12 pr-12 text-sm text-white placeholder-slate-600 outline-none transition-all focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-xs font-bold text-red-400">{errorMsg}</div>
          )}

          <button type="submit" disabled={isSubmitting}
            className="group w-full rounded-2xl bg-emerald-500 p-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50">
            {isSubmitting ? <div className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={18} /><span>Authorizing...</span></div> : "Authorize & Enter"}
          </button>
        </form>

        <footer className="mt-8 text-center text-[10px] font-bold text-slate-600">Authorized personnel only. All access is logged.</footer>
      </div>
    </div>
  );
}