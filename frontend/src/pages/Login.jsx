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
    <div className="min-h-screen w-full bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-sky-950 to-blue-900" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:44px_44px]" />

      <div className="relative w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-2xl backdrop-blur-md">
        <section className="hidden lg:flex min-h-[650px] flex-col justify-between bg-slate-900/70 p-10">
          <div>
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7m-7-9v5c0 1.8 3.1 3.2 7 3.2s7-1.4 7-3.2v-5" />
              </svg>
            </div>

            <h1 className="mt-8 text-5xl font-black leading-tight tracking-tight">
              Welcome Back to Pyramid School
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-sky-100/75">
              One login for students, teachers, and admins. After login, the app opens the correct dashboard automatically.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { title: "Students", image: "/students.png" },
              { title: "Teachers", image: "/teachers.png" },
              { title: "Admins", image: "/admins.png" },
            ].map((item) => (
              <div key={item.title} className="overflow-hidden rounded-2xl border border-white/10 bg-white/10">
                <img src={item.image} alt={item.title} className="h-28 w-full object-cover" />
                <p className="px-3 py-3 text-center text-xs font-black uppercase tracking-widest text-sky-100">
                  {item.title}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="p-6 sm:p-10 lg:p-14">
          <div className="mb-8 lg:hidden">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-cyan-400 text-slate-950 flex items-center justify-center">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7m-7-9v5c0 1.8 3.1 3.2 7 3.2s7-1.4 7-3.2v-5" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-black">Pyramid School</p>
                <p className="text-xs font-bold uppercase tracking-widest text-cyan-200">SMS Portal</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
              Secure Login
            </p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">Sign In</h2>
            <p className="mt-4 text-sm sm:text-base leading-7 text-sky-100/75">
              Enter your registered email and password. Your dashboard will open based on your account role.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-2xl border border-rose-300/40 bg-rose-500/20 p-4 text-center text-sm font-bold text-rose-50">
              {errorMessage}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="mb-2 ml-1 block text-xs font-black uppercase tracking-widest text-sky-100">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-white outline-none transition focus:border-cyan-300 focus:bg-white/15 focus:ring-2 focus:ring-cyan-300/30"
                placeholder="name@school.com"
              />
            </div>

            <div>
              <div className="mb-2 ml-1 flex items-center justify-between gap-3">
                <label className="text-xs font-black uppercase tracking-widest text-sky-100">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-black uppercase tracking-widest text-cyan-200 hover:text-white">
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-white outline-none transition focus:border-cyan-300 focus:bg-white/15 focus:ring-2 focus:ring-cyan-300/30"
                placeholder="********"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-blue-950/30 transition hover:-translate-y-0.5 hover:shadow-cyan-500/20 active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? "Signing In..." : "Login"}
            </button>
          </form>

          <div className="mt-8 rounded-2xl border border-cyan-200/20 bg-cyan-300/10 p-4">
            <p className="text-xs font-black uppercase tracking-widest text-cyan-100">
              Demo Credentials
            </p>
            <p className="mt-2 text-sm text-sky-100/80">
              Admin: admin@gmail.com / admin@123
            </p>
            <p className="mt-1 text-sm text-sky-100/80">
              Teachers and students use their seeded email with password 123456.
            </p>
          </div>

          <p className="mt-8 text-center text-xs font-medium text-sky-100/80">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-black text-white hover:underline">
              Sign Up
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Login;
