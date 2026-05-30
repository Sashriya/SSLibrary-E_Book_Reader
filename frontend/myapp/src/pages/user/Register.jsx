import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Lock, Mail, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { setUser, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const validateForm = () => {
    if (!formData.username.trim()) return "Username is required";
    if (!formData.email.trim()) return "Email is required";
    if (!formData.password) return "Password is required";
    if (formData.password.length < 6) return "Password must be at least 6 characters";
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) return "Please enter a valid email address";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await API.post("/auth/register", formData);
      const { token, user: userData } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setTimeout(() => navigate("/home"), 10);
    } catch (err) {
      setError(err.response?.data?.msg || "Registration failed. Please try again.");
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
      console.error("Google signup error:", err);
      setError(err.response?.data?.msg || "Google sign-up failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-up failed");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4 overflow-hidden">
      <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-[100px]"></div>
      <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-teal-500/10 blur-[100px]"></div>

      <div className="w-full max-w-md z-10">
        <div className="rounded-2xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-slate-800">Create Account</h2>
            <p className="text-slate-500 text-sm mt-1">Start your Tamil stories journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-center text-sm font-medium text-red-500 border border-red-100">
                {error}
              </div>
            )}

            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-slate-700 outline-none transition-all focus:border-emerald-500 focus:bg-white"
                required
              />
            </div>

            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type="email"
                name="email"
                placeholder="Email address"
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
                placeholder="Password (min 6 characters)"
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-bold text-white shadow-lg shadow-emerald-900/20 transition-all hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Create Account"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400">Or sign up with</span>
            </div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              text="signup_with"
              shape="rectangular"
            />
          </div>

          {googleLoading && (
            <div className="mt-4 text-center">
              <Loader2 size={20} className="animate-spin mx-auto text-emerald-500" />
              <p className="text-xs text-slate-400 mt-1">Signing up with Google...</p>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}