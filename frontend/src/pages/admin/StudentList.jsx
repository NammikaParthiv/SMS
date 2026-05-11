import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  approveStudentAccess,
  deleteStudentAccount,
  fetchAllStudents,
  fetchPendingStudentApprovals,
} from "../../api/axios";

const StudentList = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      setError("");

      try {
        const [studentsRes, pendingRes] = await Promise.all([
          fetchAllStudents(),
          fetchPendingStudentApprovals(),
        ]);
        setStudents(studentsRes.data || []);
        setPendingApprovals(pendingRes.data?.items || []);
      } catch (err) {
        setError(err.response?.data?.msg || "Failed to load students");
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  const handleApprove = async (student) => {
    setApprovingId(student.id);
    setError("");
    setSuccess("");

    try {
      await approveStudentAccess(student.id);
      setSuccess("Student approved successfully.");
      setPendingApprovals((prev) => prev.filter((s) => s.id !== student.id));
      setStudents((prev) => [
        { ...student, _id: student.id, approvalStatus: "approved" },
        ...prev,
      ]);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to approve student");
    } finally {
      setApprovingId("");
    }
  };

  const handleDelete = async (student) => {
    const confirmed = window.confirm(`Delete ${student.name}? This cannot be undone.`);
    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await deleteStudentAccount(student._id);
      setStudents((prev) => prev.filter((s) => s._id !== student._id));
      setSuccess("Student deleted.");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to delete student");
    }
  };

  const filtered = useMemo(
    () =>
      students.filter((student) =>
        [student.name, student.email, student.classAssigned || ""].join(" ").toLowerCase().includes(query.toLowerCase()),
      ),
    [students, query],
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between gap-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Students Directory</h1>
        <input
            type="text"
            value={query}
            placeholder="Search student by name, email, or class"
            onChange={(e) => setQuery(e.target.value)}
            className="pl-6 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-96 font-bold text-sm text-slate-800 placeholder:text-[#696969]"
          />
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-2xl text-sm font-bold">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-2xl text-sm font-bold">
          {success}
        </div>
      )}

      <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Approval Requests</h2>
            <p className="text-sm text-slate-500 font-medium">New student registration notifications</p>
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-indigo-600">
            Pending: {pendingApprovals.length}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-slate-500 font-black animate-pulse">Loading approvals...</div>
        ) : pendingApprovals.length === 0 ? (
          <div className="p-8 text-slate-500 font-semibold">No pending student approval requests.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingApprovals.map((student) => (
              <div key={student.id} className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="font-black text-slate-900">{student.name}</p>
                  <p className="text-sm text-slate-500 font-medium">{student.email}</p>
                  <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">
                    Class: {student.classAssigned || "UNASSIGNED"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleApprove(student)}
                  disabled={approvingId === student.id}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60"
                >
                  {approvingId === student.id ? "Approving..." : "Approve"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-slate-500 font-black animate-pulse">Loading students...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-slate-500 font-semibold">No student found.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Student</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Email</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Class</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((student) => (
                <tr key={student._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6 font-bold text-slate-800">{student.name}</td>
                  <td className="p-6 text-sm font-medium text-slate-500">{student.email}</td>
                  <td className="p-6 text-sm font-black text-indigo-600">{student.classAssigned || "UNASSIGNED"}</td>
                  <td className="p-6 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <button
                        onClick={() => navigate(`/profile/${student._id}`)}
                        className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline"
                      >
                        Open Profile
                      </button>
                      <button
                        onClick={() => handleDelete(student)}
                        className="text-[10px] font-black uppercase tracking-widest text-rose-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StudentList;
