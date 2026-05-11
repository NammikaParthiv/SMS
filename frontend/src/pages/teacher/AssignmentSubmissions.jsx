import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchAssignmentSubmissions } from "../../api/axios";

const AssignmentSubmissions = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const backendOrigin = useMemo(
    () => String(import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, ""),
    [],
  );

  const toPublicFileUrl = (filePath) => {
    if (!filePath) return "";
    const normalized = String(filePath).replace(/\\/g, "/").replace(/^\/+/, "");
    return `${backendOrigin}/${normalized}`;
  };

  useEffect(() => {
    const load = async () => {
      if (!assignmentId) return;
      setLoading(true);
      setError("");

      try {
        const res = await fetchAssignmentSubmissions(assignmentId);
        setAssignment(res.data?.assignment || null);
        setSummary(res.data?.summary || null);
        setRows(res.data?.students || []);
      } catch (err) {
        setError(err.response?.data?.msg || "Failed to load submissions");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [assignmentId]);

  const title = assignment?.title || "Assignment Submissions";
  const classAssigned = assignment?.classAssigned || "";
  const dueDate = assignment?.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "";
  const renderRoll = (roll, cls) => {
    if (!roll) return "N/A";
    const rollStr = String(roll).trim();
    const clsStr = String(cls || "").trim();
    if (clsStr && rollStr.toLowerCase().startsWith(`${clsStr.toLowerCase()}-`)) {
      return rollStr.slice(clsStr.length + 1);
    }
    return rollStr;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black uppercase tracking-widest hover:border-slate-300 text-black"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={() => navigate("/assignments")}
          className="px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-widest hover:bg-indigo-100"
        >
          Assignment List
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-bold">
          {error}
        </div>
      )}

      <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              Class {classAssigned || "—"} {dueDate ? `• Due ${dueDate}` : ""}
            </p>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-2">{title}</h1>
            {assignment?.description && (
              <p className="text-slate-500 font-medium mt-2 max-w-2xl">{assignment.description}</p>
            )}
          </div>
          {assignment?.fileUrl && (
            <a
              href={toPublicFileUrl(assignment.fileUrl)}
              target="_blank"
              rel="noreferrer"
              className="self-start px-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50"
            >
              View Assignment File
            </a>
          )}
        </div>

        {summary && (
          <div className="mt-6 flex flex-wrap gap-3 text-[11px] font-black uppercase tracking-widest">
            <span className="px-3 py-2 rounded-2xl bg-slate-100 text-slate-700">
              Total: {summary.totalStudents}
            </span>
            <span className="px-3 py-2 rounded-2xl bg-emerald-100 text-emerald-700">
              Submitted: {summary.submittedCount}
            </span>
            <span className="px-3 py-2 rounded-2xl bg-amber-100 text-amber-700">
              Pending: {summary.pendingCount}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white p-10 rounded-4xl border border-slate-100 shadow-sm font-black text-slate-500 animate-pulse">
          Loading submissions...
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white p-10 rounded-4xl border border-slate-100 shadow-sm text-slate-500 font-semibold">
          No students to show yet for this assignment.
        </div>
      ) : (
        <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 uppercase tracking-widest text-[10px]">
                <th className="py-3 px-3 font-black">Roll No</th>
                <th className="py-3 px-3 font-black">Student</th>
                <th className="py-3 px-3 font-black">Status</th>
                <th className="py-3 px-3 font-black">Submitted At</th>
                <th className="py-3 px-3 font-black">File</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="py-3 px-3 font-bold text-slate-800">
                    {renderRoll(row.rollNumber, row.classAssigned)}
                  </td>
                  <td className="py-3 px-3 text-slate-800">
                    <div className="font-semibold">{row.name}</div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-widest">
                      {row.classAssigned}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        row.hasSubmitted ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {row.hasSubmitted ? "Submitted" : "Pending"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "—"}
                  </td>
                  <td className="py-3 px-3">
                    {row.fileUrl ? (
                      <a
                        href={toPublicFileUrl(row.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 font-bold hover:underline"
                      >
                        View File
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AssignmentSubmissions;
