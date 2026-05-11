import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { fetchAllowedClasses } from "../api/axios";
import { SUBJECTS, subjectLabel } from "../constants/subjects";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [classAssigned, setClassAssigned] = useState("");
  const [teacherSubject, setTeacherSubject] = useState("");
  const [classes, setClasses] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await fetchAllowedClasses();
        setClasses(res.data?.classes || []);
      } catch {
        setClasses([]);
      }
    };

    loadClasses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (role === "student" && !classAssigned) {
      setErrorMessage("Please select class for student registration");
      return;
    }

    if (role === "teacher" && !teacherSubject) {
      setErrorMessage("Please select subject for teacher registration");
      return;
    }

    const result = await register(name, email, password, role, classAssigned, teacherSubject);

    if (result.success) {
      alert(result.message || "Your info is submitted.");
      navigate("/login");
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="erp-auth-shell min-h-screen w-full flex items-center justify-center p-4 font-sans overflow-hidden text-white">
      <div className="erp-auth-orb erp-auth-orb--one"></div>
      <div className="erp-auth-orb erp-auth-orb--two"></div>

      <div className="relative w-full max-w-2xl">
        <div className="erp-auth-card relative p-10 md:p-14 rounded-[2.5rem]">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black tracking-tight mb-2">Create Account</h1>
            <p className="text-sky-100/75 text-sm">Join our portal today</p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-rose-500/20 border border-rose-400/50 rounded-2xl text-rose-100 text-xs font-bold text-center">
              {errorMessage}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-1 text-sky-100/80">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/10 border border-sky-100/20 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-sky-400/60 transition-all placeholder:text-white/35"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-1 text-sky-100/80">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/10 border border-sky-100/20 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-sky-400/60 transition-all placeholder:text-white/35"
                placeholder="you@awesome.com"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-1 text-sky-100/80">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/10 border border-sky-100/20 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-sky-400/60 transition-all placeholder:text-white/35"
                placeholder="********"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-1 text-sky-100/80">
                Register As
              </label>
                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    if (e.target.value !== "student") setClassAssigned("");
                    if (e.target.value !== "teacher") {
                      setTeacherSubject("");
                    }
                  }}
                className="w-full bg-[#0b2039] border border-sky-100/20 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-sky-400/60 transition-all text-white"
              >
                <option value="student" className="bg-[#0b2039]">
                  Student
                </option>
                <option value="teacher" className="bg-[#0b2039]">
                  Teacher
                </option>
                <option value="admin" className="bg-[#0b2039]">
                  Admin
                </option>
              </select>
            </div>

            {role === "student" && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-1 text-sky-100/80">
                  Class
                </label>
                <select
                  value={classAssigned}
                  onChange={(e) => setClassAssigned(e.target.value)}
                  className="w-full bg-[#0b2039] border border-sky-100/20 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-sky-400/60 transition-all text-white"
                  required
                >
                  <option value="" className="bg-[#0b2039]">
                    Select Class
                  </option>
                  {classes.map((cls) => (
                    <option key={cls} value={cls} className="bg-[#0b2039]">
                      {cls}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {role === "teacher" && (
              <>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-1 text-sky-100/80">
                    Subject
                  </label>
                  <select
                    value={teacherSubject}
                    onChange={(e) => setTeacherSubject(e.target.value)}
                    className="w-full bg-[#0b2039] border border-sky-100/20 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-sky-400/60 transition-all text-white"
                    required
                  >
                    <option value="" className="bg-[#0b2039]">
                      Select Subject
                    </option>
                    {SUBJECTS.map((subject) => (
                      <option key={subject} value={subject} className="bg-[#0b2039]">
                        {subjectLabel(subject)}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black py-4 rounded-2xl shadow-xl hover:shadow-sky-500/25 transform transition hover:-translate-y-0.5 active:scale-95 text-xs tracking-[0.2em] uppercase mt-4"
            >
              Create {role} Account
            </button>
          </form>

          <p className="text-center mt-10 text-xs text-sky-100/80 font-medium">
            Already have an account?{" "}
            <Link to="/login" className="text-white font-black hover:underline ml-1">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
