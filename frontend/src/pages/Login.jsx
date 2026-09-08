import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedEmail = email.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (!isValidEmail) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password");
      return;
    }

    setLoading(true);
    const result = await login(trimmedEmail, password);
    setLoading(false);

    if (result.success) {
      navigate("/dashboard", { replace: true });
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-sky-950 to-blue-900" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-size-[44px_44px] pointer-events-none" />

      <div className="relative w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
        <section className="flex lg:col-span-8 w-full items-stretch justify-center order-2 lg:order-1">
          <div className="w-full h-56 sm:h-72 lg:h-full min-h-55 overflow-hidden rounded-3xl border border-white/15 bg-white/5 shadow-2xl backdrop-blur-md flex items-center justify-center p-2.5 sm:p-3">
            <img
              src="/login.png"
              alt="Portal Authentication"
              className="w-full h-full object-cover rounded-2xl drop-shadow-2xl"
            />
          </div>
        </section>

        <section className="lg:col-span-4 w-full rounded-3xl border border-white/15 bg-white/10 p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-md flex flex-col justify-center order-1 lg:order-2">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
              <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7m-7-9v5c0 1.8 3.1 3.2 7 3.2s7-1.4 7-3.2v-5" />
              </svg>
            </div>
            <div>
              <p className="text-lg sm:text-xl font-black leading-tight">Pyramid School</p>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-cyan-200">SMS Portal</p>
            </div>
          </div>

          <div className="mb-6 sm:mb-8">
            <p className="mb-1.5 sm:mb-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
              Secure Login
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">Sign In</h1>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-sky-100/75">
              Enter your registered email and password to access your role-based workspace.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 sm:mb-6 rounded-2xl border border-rose-300/40 bg-rose-500/20 p-3 sm:p-4 text-center text-xs sm:text-sm font-bold text-rose-50">
              {errorMessage}
            </div>
          )}

          <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="mb-1.5 sm:mb-2 ml-1 block text-[10px] sm:text-xs font-black uppercase tracking-widest text-sky-100">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 sm:px-5 py-3 sm:py-3.5 lg:py-4 text-sm sm:text-base text-white placeholder:text-sky-100/40 outline-none transition focus:border-cyan-300 focus:bg-white/15 focus:ring-2 focus:ring-cyan-300/30"
                placeholder="name@school.com"
              />
            </div>

            <div>
              <div className="mb-1.5 sm:mb-2 ml-1 flex items-center justify-between gap-3">
                <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-sky-100">
                  Password
                </label>
                <Link to="/forgot-password" className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-cyan-200 hover:text-white transition-colors">
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 sm:px-5 py-3 sm:py-3.5 lg:py-4 text-sm sm:text-base text-white placeholder:text-sky-100/40 outline-none transition focus:border-cyan-300 focus:bg-white/15 focus:ring-2 focus:ring-cyan-300/30"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-linear-to-r from-cyan-400 to-blue-600 px-5 py-3.5 sm:py-4 text-xs sm:text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-blue-950/30 transition hover:-translate-y-0.5 hover:shadow-cyan-500/20 active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? "Signing In..." : "Login"}
            </button>
          </form>

          <p className="mt-6 sm:mt-8 text-center text-xs sm:text-sm font-medium text-sky-100/80">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-black text-cyan-200 hover:text-white transition-colors underline-offset-4 hover:underline">
              Sign Up
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Login;