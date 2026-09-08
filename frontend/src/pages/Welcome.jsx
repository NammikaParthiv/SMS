import React, { useState } from "react";
import { Link } from "react-router-dom";

const roleWorkspaces = [
  {
    roleTitle: "Admin Workspace",
    badge: "Admin Access",
    badgeLight: "bg-amber-100 text-amber-900 border-amber-300",
    badgeDark: "bg-amber-950/60 text-amber-300 border-amber-700/50",
    image: "/admins.png",
    imageAlt: "School Admin Panel Preview",
    headline:
      "Central dashboard to manage teachers, track class records, and monitor overall school activity.",
    featureGroups: [
      {
        heading: "Teacher & Class Records",
        items: [
          "Assign teachers directly to specific classes, subjects, and sections.",
          "Check and update student class rosters whenever needed.",
          "Keep track of academic terms, schedules, and everyday school routines.",
        ],
      },
      {
        heading: "Attendance & Overall Audits",
        items: [
          "Review all assignments, test marks, and reports from one spot.",
          "Keep tabs on daily student attendance records across the campus.",
          "Post important circulars, school notices, and upcoming holiday lists.",
        ],
      },
    ],
  },
  {
    roleTitle: "Teacher Workspace",
    badge: "Faculty Desk",
    badgeLight: "bg-teal-100 text-teal-900 border-teal-300",
    badgeDark: "bg-teal-950/60 text-teal-300 border-teal-700/50",
    image: "/teachers.png",
    imageAlt: "Teacher Portal Preview",
    headline:
      "Everything teachers need to post homework, enter grades, and follow student progress.",
    featureGroups: [
      {
        heading: "Assignments & Marks",
        items: [
          "Upload assignments with clear deadlines and files for students to download.",
          "Easily update or extend due dates for specific students or the entire class.",
          "Review submitted work, enter grades, and leave feedback comments.",
        ],
      },
      {
        heading: "Class Rosters & Attendance",
        items: [
          "Open your class list anytime to see how each student is performing.",
          "Spot students falling behind early so you can help them catch up.",
          "Mark daily class attendance quickly right from your laptop or phone.",
        ],
      },
    ],
  },
  {
    roleTitle: "Student Workspace",
    badge: "Student Desk",
    badgeLight: "bg-sky-100 text-sky-900 border-sky-300",
    badgeDark: "bg-sky-950/60 text-sky-300 border-sky-700/50",
    image: "/students.png",
    imageAlt: "Student Dashboard Preview",
    headline:
      "Your personal portal to turn in work on time, view your marks, and check your attendance.",
    featureGroups: [
      {
        heading: "Homework & Deadlines",
        items: [
          "See all upcoming assignment deadlines in order so you never miss one.",
          "Upload your finished homework files straight through your account.",
          "View your grades, scorecard breakdowns, and teacher feedback right away.",
        ],
      },
      {
        heading: "Attendance & Updates",
        items: [
          "Check your live attendance percentage so you stay above the minimum.",
          "Read important school notices, exam dates, and circulars as soon as they drop.",
          "Review your previous term results and report cards whenever you want.",
        ],
      },
    ],
  },
];

const Welcome = () => {
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div
      className={`relative min-h-screen w-full flex flex-col justify-between transition-colors duration-200 ${
        isDark ? "bg-slate-950 text-slate-100" : "bg-[#f8fafc] text-black"
      }`}
    >
      <div
        className={`absolute inset-0 bg-size-[3.5rem_3.5rem] mask-[radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none ${
          isDark
            ? "bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)]"
            : "bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)]"
        }`}
      />

      <header
        className={`sticky top-0 z-50 w-full border-b shadow-sm transition-colors duration-200 ${
          isDark
            ? "bg-slate-900 border-slate-800 text-white"
            : "bg-white border-slate-200 text-black"
        }`}
      >
        <div className="w-full px-4 sm:px-8 lg:px-12 py-5 sm:py-6 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-teal-400 shadow-md shrink-0 ${
                isDark ? "bg-slate-800 border border-slate-700" : "bg-black"
              }`}
            >
              <svg
                className="w-7 h-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5"
                />
              </svg>
            </div>
            <div>
              <span
                className={`text-xl sm:text-2xl font-extrabold tracking-tight block leading-tight ${
                  isDark ? "text-white" : "text-black"
                }`}
              >
                SMS Portal
              </span>
              <span
                className={`text-xs font-bold tracking-wide uppercase block ${
                  isDark ? "text-slate-400" : "text-neutral-700"
                }`}
              >
                School Management System
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setIsDark(!isDark)}
              type="button"
              aria-label="Toggle dark mode"
              className={`p-2.5 rounded-xl border shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700"
                  : "bg-white border-slate-300 text-black hover:bg-slate-50"
              }`}
            >
              {isDark ? (
                <svg
                  className="w-5 h-5 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 fill-current"
                  viewBox="0 0 20 20"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            <Link
              to="/login"
              className={`px-6 py-2.5 rounded-xl border font-bold text-sm tracking-wide shadow-sm hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all duration-200 ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                  : "bg-white border-slate-300 text-black hover:bg-slate-50"
              }`}
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-6 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-sm tracking-wide shadow-md shadow-teal-600/20 hover:bg-teal-500 hover:-translate-y-0.5 hover:scale-105 hover:shadow-teal-600/30 active:scale-95 transition-all duration-200"
            >
              Get Started
            </Link>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsDark(!isDark)}
              type="button"
              aria-label="Toggle dark mode"
              className={`p-2 rounded-xl border shadow-sm active:scale-95 transition-all duration-200 flex items-center justify-center ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-amber-400"
                  : "bg-white border-slate-300 text-black"
              }`}
            >
              {isDark ? (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              type="button"
              aria-label="Toggle navigation menu"
              className={`p-2 rounded-xl border shadow-sm active:scale-95 transition-all duration-200 flex items-center justify-center ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-white"
                  : "bg-white border-slate-300 text-black"
              }`}
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div
            className={`md:hidden px-4 pb-6 pt-2 border-t flex flex-col gap-3 transition-colors duration-200 ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <Link
              to="/login"
              onClick={() => setIsMenuOpen(false)}
              className={`w-full py-3 rounded-xl border font-bold text-sm tracking-wide text-center shadow-sm transition-all duration-200 ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-white"
                  : "bg-white border-slate-300 text-black"
              }`}
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={() => setIsMenuOpen(false)}
              className="w-full py-3 rounded-xl bg-teal-600 text-white font-bold text-sm tracking-wide text-center shadow-md shadow-teal-600/20 active:scale-95 transition-all duration-200"
            >
              Get Started
            </Link>
          </div>
        )}
      </header>

      <main className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-12 sm:py-16 flex-1">
        <section className="text-center max-w-3xl mx-auto">
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-sm ${
              isDark
                ? "bg-slate-800 border-slate-700 text-slate-200"
                : "bg-white border-slate-300 text-black"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-xs font-bold tracking-wide uppercase">
              All-In-One Campus Portal
            </span>
          </div>

          <h1
            className={`mt-6 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] ${
              isDark ? "text-white" : "text-black"
            }`}
          >
            Smarter School Management, Better Learning
          </h1>

          <p
            className={`mt-5 text-base sm:text-lg leading-relaxed font-semibold ${
              isDark ? "text-slate-300" : "text-black"
            }`}
          >
            Whether you are running the school, teaching a subject, or checking your daily assignments,
            everything you need is organized right here.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl text-white font-bold text-sm tracking-wide shadow-lg hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2.5 ${
                isDark ? "bg-teal-600 hover:bg-teal-500 shadow-teal-950/40" : "bg-black hover:bg-slate-900 shadow-black/20"
              }`}
            >
              <span>Get Started</span>
              <svg
                className="w-4 h-4 text-teal-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link
              to="/login"
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl border font-bold text-sm tracking-wide shadow-sm hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                  : "bg-white border-slate-300 text-black hover:bg-slate-50"
              }`}
            >
              Login to Account
            </Link>
          </div>
        </section>

        <section className="mt-14 sm:mt-20 space-y-8 sm:space-y-12">
          {roleWorkspaces.map((role) => (
            <article
              key={role.roleTitle}
              className={`w-full rounded-2xl sm:rounded-3xl border p-6 sm:p-8 lg:p-10 shadow-sm hover:shadow-md transition-shadow duration-200 ${
                isDark
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200"
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
                <div className="w-full lg:col-span-5 flex flex-col justify-center items-center my-auto">
                  <div
                    className={`w-full max-w-90 lg:max-w-full h-56 sm:h-64 lg:h-72 rounded-2xl overflow-hidden border shadow-inner flex items-center justify-center ${
                      isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <img
                      src={role.image}
                      alt={role.imageAlt}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                </div>

                <div className="w-full lg:col-span-7 flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md border ${
                        isDark ? role.badgeDark : role.badgeLight
                      }`}
                    >
                      {role.badge}
                    </span>
                  </div>

                  <h2
                    className={`mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight ${
                      isDark ? "text-white" : "text-black"
                    }`}
                  >
                    {role.roleTitle}
                  </h2>

                  <p
                    className={`mt-2 text-base leading-relaxed font-medium ${
                      isDark ? "text-slate-300" : "text-black"
                    }`}
                  >
                    {role.headline}
                  </p>

                  <div
                    className={`mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t ${
                      isDark ? "border-slate-800" : "border-slate-200"
                    }`}
                  >
                    {role.featureGroups.map((group) => (
                      <div key={group.heading} className="space-y-3">
                        <h3
                          className={`text-sm sm:text-base font-bold uppercase tracking-wide flex items-center gap-2 ${
                            isDark ? "text-slate-100" : "text-black"
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                          {group.heading}
                        </h3>
                        <ul className="space-y-3">
                          {group.items.map((item, itemIdx) => (
                            <li
                              key={itemIdx}
                              className={`flex items-start gap-2.5 text-sm sm:text-base leading-relaxed font-normal ${
                                isDark ? "text-slate-300" : "text-black"
                              }`}
                            >
                              <svg
                                className="w-5 h-5 text-teal-600 shrink-0 mt-0.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2.5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>

      <footer
        className={`relative z-10 w-full border-t py-6 mt-16 transition-colors duration-200 ${
          isDark
            ? "bg-slate-900 border-slate-800 text-slate-400"
            : "bg-white border-slate-200 text-black"
        }`}
      >
        <div className="w-full px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm">
          <p>© {new Date().getFullYear()} School Management System. Built for school projects.</p>
          <div
            className={`flex items-center gap-6 font-semibold ${
              isDark ? "text-slate-300" : "text-black"
            }`}
          >
            <Link to="/login" className="hover:text-teal-600 hover:scale-105 transition-all">
              Login
            </Link>
            <Link to="/register" className="hover:text-teal-600 hover:scale-105 transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;