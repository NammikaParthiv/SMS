import React from "react";

const TeacherDashboard = ({ user }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 rounded-4xl p-10 text-white shadow-2xl">
        <h1 className="text-4xl font-black tracking-tight">Faculty Dashboard</h1>
        <p className="text-emerald-50 text-lg mt-3">You have 2 classes today. Your next lecture starts in 45 minutes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-4xl border-l-8 border-l-emerald-500 shadow-sm">
          <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest">Students Mentored</h3>
          <p className="text-4xl font-black text-slate-800 mt-2">156</p>
        </div>
        <div className="bg-white p-8 rounded-4xl border-l-8 border-l-teal-500 shadow-sm">
          <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest">Grading Progress</h3>
          <p className="text-4xl font-black text-slate-800 mt-2">82%</p>
        </div>
        <div className="bg-white p-8 rounded-4xl border-l-8 border-l-blue-500 shadow-sm">
          <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest">Exam Schedule</h3>
          <p className="text-4xl font-black text-slate-800 mt-2">02</p>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
