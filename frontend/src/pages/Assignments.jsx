import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchStudentAssignments, submitAssignmentFile } from "../api/axios";

const statusPriority = {
  Pending: 0,
  Late: 1,
  Submitted: 2,
};

const Assignments = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedTask, setSelectedTask] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const backendOrigin = useMemo(
    () => String(import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, ""),
    [],
  );

  const orderedTasks = useMemo(() => {
    const list = [...tasks];

    list.sort((a, b) => {
      const pA = statusPriority[a.status] ?? 99;
      const pB = statusPriority[b.status] ?? 99;
      if (pA !== pB) return pA - pB;

      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    return list;
  }, [tasks]);

  const toPublicFileUrl = (filePath) => {
    if (!filePath) return "";
    const normalized = String(filePath).replace(/\\/g, "/").replace(/^\/+/, "");
    return `${backendOrigin}/${normalized}`;
  };

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchStudentAssignments();
      setTasks(res.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const handleSubmitWork = async () => {
    if (!selectedTask) return;

    if (!submissionFile) {
      setError("Please select a file before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", submissionFile);

      await submitAssignmentFile(selectedTask.id, formData);
      setSuccess("Assignment submitted successfully.");
      setSelectedTask(null);
      setSubmissionFile(null);
      await loadAssignments();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to submit assignment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-4 md:mx-12 mt-12 mb-16 animate-in fade-in duration-700">
      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-bold">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-sm font-bold">
          {success}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm font-black text-slate-500 animate-pulse">
          Loading assignments...
        </div>
      ) : orderedTasks.length === 0 ? (
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm text-slate-500 font-semibold">
          No assignments available for your class right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {orderedTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => {
                setSelectedTask(task);
                setSubmissionFile(null);
              }}
              className="group relative bg-white p-12 rounded-[2.8rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden min-h-[320px]"
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    {"\u{1F4C4}"}
                  </div>
                  <span
                    className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                      task.status === "Submitted"
                        ? "bg-emerald-100 text-emerald-600"
                        : task.status === "Late"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-600"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>

                <h3 className="text-3xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                  {task.title}
                </h3>

                <p className="text-slate-400 text-xs font-black mt-4 uppercase tracking-widest">
                  Due Date: <span className="text-slate-600">{new Date(task.dueDate).toLocaleDateString()}</span>
                </p>

                <p className="text-slate-400 text-xs font-black mt-3 uppercase tracking-widest">
                  Class: <span className="text-slate-600">{task.classAssigned}</span>
                </p>

                <div className="mt-12 flex items-center text-indigo-600 text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                  Open Assignment
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row">
            <div className="w-full md:w-1/2 bg-slate-50 p-10 flex flex-col items-center justify-center border-r border-slate-100">
              <span className="text-6xl mb-6">{"\u{1F4C4}"}</span>
              <h4 className="font-bold text-slate-800 text-center uppercase tracking-tight mb-2">Reference Material</h4>
              <p className="text-sm text-slate-400 mb-6 break-all text-center">{selectedTask.fileUrl}</p>
              <a
                href={toPublicFileUrl(selectedTask.fileUrl)}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                View File
              </a>
            </div>

            <div className="w-full md:w-1/2 p-10 flex flex-col justify-between">
              <div>
                <button
                  onClick={() => {
                    setSelectedTask(null);
                    setSubmissionFile(null);
                  }}
                  className="float-right text-slate-300 hover:text-slate-800 text-3xl font-light cursor-pointer"
                >
                  ×
                </button>
                <h2 className="text-3xl font-black text-slate-900 mb-2">{selectedTask.title}</h2>
                <p className="text-slate-400 text-sm font-medium">Upload your final solution in PDF/JPG/PNG format.</p>

                <div className="mt-8 space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/jpeg,image/png"
                    onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-6 py-4 border border-slate-300 rounded-2xl bg-slate-50 text-sm font-black text-slate-800 hover:bg-slate-100 transition-colors"
                  >
                    {submissionFile ? "Change File" : "Select File"}
                  </button>
                  <p className="text-xs text-slate-500 font-medium min-h-[20px]">
                    {submissionFile ? submissionFile.name : "No file chosen"}
                  </p>
                </div>
              </div>

              <button
                onClick={handleSubmitWork}
                disabled={submitting}
                className="mt-8 px-6 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;
