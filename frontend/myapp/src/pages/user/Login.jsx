import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, ArrowRight, Loader2, Mail, Eye, EyeOff } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password) {
      setError("Please fill in all fields");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await login(formData.email, formData.password);
    } catch (err) {
      setError(err.response?.data?.msg || "Invalid email or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true);
    setError("");
    try {
      await googleLogin(credentialResponse.credential);
      navigate("/home");
    } catch (err) {
      console.error("Google login error:", err);
      setError(err.response?.data?.msg || "Google login failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google login failed. Please try again.");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4 overflow-hidden">
      <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-[100px]"></div>
      <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-teal-500/10 blur-[100px]"></div>

      <div className="w-full max-w-md z-10">
        <div className="rounded-2xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-slate-800">Welcome Back</h2>
            <p className="text-slate-500 text-sm mt-1">Login to continue your journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-center text-sm font-medium text-red-500 border border-red-100">
                {error}
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type="text"
                name="email"
                placeholder="Email or Username"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-slate-700 outline-none transition-all focus:border-emerald-500 focus:bg-white"
                required
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-slate-700 outline-none transition-all focus:border-emerald-500 focus:bg-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-emerald-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-bold text-white shadow-lg shadow-emerald-900/20 transition-all hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Sign In"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400">Or continue with</span>
            </div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
            />
          </div>

          {googleLoading && (
            <div className="mt-4 text-center">
              <Loader2 size={20} className="animate-spin mx-auto text-emerald-500" />
              <p className="text-xs text-slate-400 mt-1">Signing in with Google...</p>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}