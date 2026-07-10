import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { resetPassword } from "../api/axios";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setMessage("");

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const { data } = await resetPassword(token, { password, confirmPassword });
      setMessage(data?.msg || "Password reset successfully.");
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (error) {
      setErrorMessage(error.response?.data?.msg || "Could not reset password");
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
              Secure Reset
            </p>
            <h1 className="text-4xl font-black tracking-tight mb-3">New Password</h1>
            <p className="text-sky-100/75 text-sm leading-6">
              Choose a password that is easy for you to remember and hard for others to guess.
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

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-1 text-sky-100/80">
                New Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/10 border border-sky-100/20 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-sky-400/60 transition-all placeholder:text-white/35 text-white"
                placeholder="********"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-1 text-sky-100/80">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/10 border border-sky-100/20 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-sky-400/60 transition-all placeholder:text-white/35 text-white"
                placeholder="********"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black py-4 rounded-2xl shadow-xl hover:shadow-sky-500/25 transform transition hover:-translate-y-0.5 active:scale-95 text-xs tracking-[0.2em] uppercase disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? "Saving Password..." : "Reset Password"}
            </button>
          </form>

          <p className="text-center mt-10 text-xs text-sky-100/80 font-medium">
            Back to{" "}
            <Link to="/login" className="text-white font-black hover:underline ml-1">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
