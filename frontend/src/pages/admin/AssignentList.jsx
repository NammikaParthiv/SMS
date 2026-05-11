import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';

const AdminAssignmentAudit = () => {
  const { auth } = useAuth();

  // Guard: Only Admin allowed
  if (auth?.role?.toLowerCase() !== 'admin') {
    return <Navigate to="/" />;
  }

  // Mock data for Admin Oversight
  const globalStats = [
    { label: "Total Assignments", value: "156", color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Submissions", value: "89%", color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Pending Review", value: "24", color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const recentAssignments = [
    { id: 1, title: 'Quantum Physics Lab', teacher: 'Dr. Sarah Connor', class: '12-A', submissions: '28/30' },
    { id: 2, title: 'Modern History Essay', teacher: 'Maria Garcia', class: '11-B', submissions: '15/25' },
    { id: 3, title: 'Organic Chemistry', teacher: 'Prof. James Wilson', class: '12-C', submissions: '22/22' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 1. Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {globalStats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{stat.label}</h4>
            <p className={`text-4xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 2. Global Audit Table */}
      <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Active Assignments Audit</h2>
          <p className="text-slate-400 text-xs font-medium mt-1">Monitoring submission health across all departments</p>
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Assignment Title</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned By</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Target Class</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Completion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {recentAssignments.map((task) => (
              <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-6 font-bold text-slate-800">{task.title}</td>
                <td className="p-6 text-sm text-slate-500 font-medium">{task.teacher}</td>
                <td className="p-6 text-sm font-black text-indigo-600">{task.class}</td>
                <td className="p-6 text-right font-mono font-bold text-slate-700">{task.submissions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAssignmentAudit;