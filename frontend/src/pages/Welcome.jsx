import React from "react";
import { Link } from "react-router-dom";

const flowPoints = [
  {
    title: "Admin Command",
    lines: [
      "Allocate teachers and monitor class-wise student records.",
      "Review assignments, marks, and attendance with one control panel.",
    ],
  },
  {
    title: "Teacher Workspace",
    lines: [
      "Create assignments, extend due dates, and track submissions.",
      "Open class rosters instantly and follow progress per student.",
    ],
  },
  {
    title: "Student Journey",
    lines: [
      "See assignment deadlines, submit work, and check marks quickly.",
      "Stay updated with attendance and profile activity in one place.",
    ],
  },
];

const Welcome = () => {
  return (
    <div className="erp-auth-shell min-h-screen w-full overflow-hidden text-white">
      <div className="erp-auth-orb erp-auth-orb--one"></div>
      <div className="erp-auth-orb erp-auth-orb--two"></div>

      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 py-10 md:py-14">
        <section className="text-center">
          <p className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-sky-100/35 text-xs font-black uppercase tracking-[0.22em] text-sky-100">
            School Management System
          </p>

          <h1 className="mt-7 text-4xl md:text-6xl font-black tracking-tight leading-tight">
            One Digital Campus
            <span className="block text-sky-200">for Admin, Teachers, and Students</span>
          </h1>

          <p className="mt-6 max-w-3xl mx-auto text-slate-100/90 font-medium leading-relaxed">
            Manage classes, assignments, notifications, marks, and student profiles through a single
            role-based platform built for everyday school operations.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="px-10 py-4 rounded-2xl bg-cyan-400 text-slate-950 font-black uppercase tracking-widest text-xs hover:bg-cyan-300 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-10 py-4 rounded-2xl border border-white/30 bg-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/20 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </section>

        <section className="mt-14 md:mt-16">
          <div className="erp-welcome-flow">
            {flowPoints.map((point, index) => (
              <article key={point.title} className="erp-welcome-flow-item">
                <div className="erp-welcome-pointer" aria-hidden="true">
                  <span>{index + 1}</span>
                </div>
                <div className="erp-welcome-flow-copy">
                  <h2 className="text-2xl md:text-3xl font-black text-cyan-100">{point.title}</h2>
                  <ul className="mt-3 space-y-2">
                    {point.lines.map((line) => (
                      <li key={line} className="erp-welcome-line text-slate-100/90 font-medium">
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Welcome;
