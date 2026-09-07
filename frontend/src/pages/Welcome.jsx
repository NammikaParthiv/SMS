import React from "react";
import { Link } from "react-router-dom";

const roleWorkspaces = [
  {
    roleTitle: "Admin Workspace",
    badge: "Admin Access",
    badgeStyle: "bg-amber-100 text-amber-900 border-amber-300",
    image: "/admins.png",
    imageAlt: "School Admin Panel Preview",
    headline: "Central dashboard to manage teachers, track class records, and monitor overall school activity.",
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
    badgeStyle: "bg-teal-100 text-teal-900 border-teal-300",
    image: "/teachers.png",
    imageAlt: "Teacher Portal Preview",
    headline: "Everything teachers need to post homework, enter grades, and follow student progress.",
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
    badgeStyle: "bg-sky-100 text-sky-900 border-sky-300",
    image: "/students.png",
    imageAlt: "Student Dashboard Preview",
    headline: "Your personal portal to turn in work on time, view your marks, and check your attendance.",
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
  return (
    <div className="relative min-h-screen w-full bg-[#f8fafc] text-slate-800 flex flex-col justify-between">
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" 
      />

      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="w-full px-4 sm:px-8 lg:px-12 py-5 sm:py-6 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-teal-400 shadow-md">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5" />
              </svg>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 block leading-tight">
                SMS Portal
              </span>
              <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase block">
                School Management System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/login"
              className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 bg-white font-bold text-sm tracking-wide shadow-sm hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all duration-200"
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
        </div>
      </header>

      <main className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-12 sm:py-16 flex-1">
        <section className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-600 tracking-wide uppercase">
              All-In-One Campus Portal
            </span>
          </div>

          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            One Simple Place for School Work, Classes & Records
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Whether you are running the school, teaching a subject, or checking your daily assignments,
            everything you need is organized right here.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm tracking-wide shadow-lg shadow-slate-900/15 hover:bg-slate-800 hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2.5"
            >
              <span>Get Started</span>
              <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-bold text-sm tracking-wide shadow-sm hover:border-slate-400 hover:bg-slate-50 hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
            >
              Login to Account
            </Link>
          </div>
        </section>

        <section className="mt-14 sm:mt-20 space-y-8 sm:space-y-12">
          {roleWorkspaces.map((role) => (
            <article
              key={role.roleTitle}
              className="w-full rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 lg:p-10 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
                <div className="w-full lg:col-span-5 flex flex-col justify-center items-center my-auto">
                  <div className="w-full max-w-[360px] lg:max-w-full h-56 sm:h-64 lg:h-72 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner flex items-center justify-center">
                    <img
                      src={role.image}
                      alt={role.imageAlt}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                </div>

                <div className="w-full lg:col-span-7 flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md border ${role.badgeStyle}`}>
                      {role.badge}
                    </span>
                  </div>

                  <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {role.roleTitle}
                  </h2>

                  <p className="mt-2 text-base text-slate-600 leading-relaxed font-normal">
                    {role.headline}
                  </p>

                  <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                    {role.featureGroups.map((group) => (
                      <div key={group.heading} className="space-y-3">
                        <h3 className="text-sm sm:text-base font-bold uppercase tracking-wide text-slate-900 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                          {group.heading}
                        </h3>
                        <ul className="space-y-3">
                          {group.items.map((item, itemIdx) => (
                            <li key={itemIdx} className="flex items-start gap-2.5 text-sm sm:text-base text-slate-700 leading-relaxed">
                              <svg className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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

      <footer className="relative z-10 w-full border-t border-slate-200 bg-white py-6 mt-16">
        <div className="w-full px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-500">
          <p>© {new Date().getFullYear()} School Management System. Built for school projects.</p>
          <div className="flex items-center gap-6 font-semibold text-slate-700">
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
