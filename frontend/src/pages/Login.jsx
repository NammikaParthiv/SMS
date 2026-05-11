import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { fetchAllowedClasses } from "../api/axios";

const fallbackClasses = [
  "8-A", "8-B", "8-C", "8-D",
  "9-A", "9-B", "9-C", "9-D",
  "10-A", "10-B", "10-C", "10-D",
];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Student");
  const [classAssigned, setClassAssigned] = useState("");
  const [classes, setClasses] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await fetchAllowedClasses();
        setClasses(res.data?.classes?.length ? res.data.classes : fallbackClasses);
      } catch {
        setClasses(fallbackClasses);
      }
    };
    loadClasses();
  }, []);

  const roleImages = {
    Student: "/students.png",
    Teacher: "/teachers.png",
    Admin: "/admins.png",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedEmail = email.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (!isValidEmail) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    if (role === "Student" && !classAssigned) {
      setErrorMessage("Please select your class");
      return;
    }

    const result = await login(trimmedEmail, password, role, classAssigned);
    if (result.success) {
      navigate("/dashboard", { replace: true });
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="erp-auth-shell min-h-screen w-full flex items-center justify-center p-6 font-sans overflow-hidden">
      <div className="erp-auth-orb erp-auth-orb--one"></div>
      <div className="erp-auth-orb erp-auth-orb--two"></div>

      <div className="erp-auth-card relative w-full max-w-6xl flex flex-col md:flex-row rounded-4xl overflow-hidden">
        <div className="w-full md:w-1/2 erp-auth-subcard flex items-center justify-center p-12 relative overflow-hidden border-b md:border-b-0 md:border-r border-sky-100/20">
          <div className="absolute w-64 h-64 border border-white/10 rounded-full animate-[spin_20s_linear_infinite]"></div>

          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
            <img
              src={roleImages[role]}
              alt={role}
              className="w-full max-h-[400px] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in slide-in-from-left-10 duration-700"
              key={role}
            />
            <div className="mt-8 text-center">
              <h3 className="text-2xl font-black text-white tracking-tight uppercase italic">{role} Portal</h3>
              <div className="h-1 w-12 bg-gradient-to-r from-sky-400 to-blue-500 mx-auto mt-2 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center text-white">
          <div className="mb-10 text-left">
            <h1 className="text-5xl font-black mb-3 tracking-tighter">Sign In</h1>
            <p className="text-sky-100/70 font-medium">
              Please enter your credentials to access your dashboard.
            </p>
          </div>

          <div className="flex bg-[#081325]/70 p-1.5 rounded-2xl mb-8 border border-sky-100/15">
            {["Student", "Teacher", "Admin"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRole(r);
                  if (r !== "Student") setClassAssigned("");
                }}
                className={`flex-1 py-3 text-xs font-black rounded-xl transition-all duration-300 ${
                  role === r
                    ? "bg-white text-sky-900 shadow-xl scale-[1.02]"
                    : "text-sky-100/70 hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-rose-500/20 border border-rose-400/50 rounded-2xl text-rose-100 text-xs font-bold text-center animate-in fade-in zoom-in-95">
              {errorMessage}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-sky-100 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/10 border border-sky-100/20 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-sky-400/60 focus:bg-white/15 transition-all"
                placeholder="name@school.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-sky-100 uppercase tracking-widest ml-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/10 border border-sky-100/20 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-sky-400/60 focus:bg-white/15 transition-all"
                placeholder="********"
              />
            </div>

            {role === "Student" && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-sky-100 uppercase tracking-widest ml-1">
                  Class
                </label>
                <select
                  required
                  value={classAssigned}
                  onChange={(e) => setClassAssigned(e.target.value)}
                  className="w-full bg-white/10 border border-sky-100/20 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-sky-400/60 focus:bg-white/15 transition-all"
                >
                  <option value="" className="text-slate-900">
                    Select Class
                  </option>
                  {classes.map((cls) => (
                    <option key={cls} value={cls} className="text-slate-900">
                      {cls}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 py-4 mt-4 rounded-2xl font-black uppercase tracking-widest text-xs text-white hover:shadow-[0_10px_30px_-10px_rgba(14,165,233,0.55)] transition-all active:scale-[0.98]"
            >
              Login to {role} Dashboard
            </button>
          </form>

          <p className="text-center mt-8 text-xs text-sky-100/80 font-medium">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-white font-black hover:underline ml-1">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
