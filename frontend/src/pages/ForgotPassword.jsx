import React, { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../api/axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setMessage("");
    setResetUrl("");

    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      const { data } = await requestPasswordReset(trimmedEmail);
      setMessage(data?.msg || "Password reset instructions are ready.");
      if (data?.resetUrl) setResetUrl(data.resetUrl);
    } catch (error) {
      setErrorMessage(error.response?.data?.msg || "Could not request password reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="erp-auth-shell min-h-screen w-full flex items-center justify-center p-6 font-sans overflow-hidden text-white">
      <div className="erp-auth-orb erp-auth-orb--one"></div>
      <div className="erp-auth-orb erp-auth-orb--two"></div>

      <div className="relative w-full max-w-xl">
        <div className="erp-auth-card relative p-10 md:p-14 rounded-[2.5rem]">
          <div className="text-center mb-8">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200 mb-3">
              Account Recovery
            </p>
            <h1 className="text-4xl font-black tracking-tight mb-3">Reset Password</h1>
            <p className="text-sky-100/75 text-sm leading-6">
              Enter your registered email and create a fresh password using the reset link.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-rose-500/20 border border-rose-400/50 rounded-2xl text-rose-100 text-xs font-bold text-center">
              {errorMessage}
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 bg-emerald-500/15 border border-emerald-300/40 rounded-2xl text-emerald-50 text-xs font-bold text-center">
              {message}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-1 text-sky-100/80">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/10 border border-sky-100/20 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-sky-400/60 transition-all placeholder:text-white/35 text-white"
                placeholder="name@school.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black py-4 rounded-2xl shadow-xl hover:shadow-sky-500/25 transform transition hover:-translate-y-0.5 active:scale-95 text-xs tracking-[0.2em] uppercase disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? "Preparing Link..." : "Get Reset Link"}
            </button>
          </form>

          {resetUrl && (
            <div className="mt-6 rounded-2xl border border-cyan-200/30 bg-cyan-300/10 p-4 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100 mb-3">
                Development Link
              </p>
              <Link to={new URL(resetUrl).pathname} className="text-sm font-black text-white underline break-all">
                Open reset page
              </Link>
            </div>
          )}

          <p className="text-center mt-10 text-xs text-sky-100/80 font-medium">
            Remembered it?{" "}
            <Link to="/login" className="text-white font-black hover:underline ml-1">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
