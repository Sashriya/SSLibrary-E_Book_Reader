// pages/user/ForgotPassword.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await API.post("/user/forgot-password", { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Check Your Email</h2>
            <p className="text-slate-500 mb-4">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700"
            >
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Forgot Password?</h2>
            <p className="text-slate-500 text-sm mt-1">Enter your email to receive a reset link</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 outline-none focus:border-emerald-500 focus:bg-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold hover:from-emerald-500 hover:to-teal-500 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Send Reset Link"}
            </button>
          </form>

          <div className="text-center mt-6">
            <Link to="/login" className="text-sm text-emerald-600 hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}