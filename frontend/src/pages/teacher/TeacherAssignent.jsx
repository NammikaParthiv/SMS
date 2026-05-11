import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createAssignment,
  extendTeacherAssignmentDueDate,
  fetchAllowedClasses,
  listTeacherAssignments,
} from "../../api/axios";

const initialForm = {
  title: "",
  description: "",
  classAssigned: "",
  dueDate: "",
  file: null,
};

const toDateInputValue = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
};

const TeacherAssignments = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [extendedDueDate, setExtendedDueDate] = useState("");

  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [extending, setExtending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const minDueDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  const loadAssignments = async () => {
    try {
      const res = await listTeacherAssignments();
      setAssignments(res.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load assignments");
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      setError("");

      try {
        const [classRes, taskRes] = await Promise.all([
          fetchAllowedClasses(),
          listTeacherAssignments(),
        ]);

        setClasses(classRes.data?.classes || []);
        setAssignments(taskRes.data?.items || []);
      } catch (err) {
        setError(err.response?.data?.msg || "Failed to initialize assignment manager");
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.title || !form.description || !form.classAssigned || !form.dueDate || !form.file) {
      setError("Please fill title, description, class, due date, and file.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("title", form.title);
      payload.append("description", form.description);
      payload.append("classAssigned", form.classAssigned);
      payload.append("dueDate", form.dueDate);
      payload.append("file", form.file);

      const res = await createAssignment(payload);
      await loadAssignments();
      setSuccess(`Published successfully. ${res.data?.notificationsSent || 0} students were notified.`);
      resetForm();
      setShowCreateModal(false);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to create assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const openExtendModal = (assignment) => {
    setSelectedAssignment(assignment);
    setExtendedDueDate(toDateInputValue(assignment.dueDate));
    setShowExtendModal(true);
  };

  const closeExtendModal = () => {
    setShowExtendModal(false);
    setSelectedAssignment(null);
    setExtendedDueDate("");
  };

  const buildSubmissionPath = (assignment) => {
    const slugBase = `${assignment.classAssigned || "class"}-${assignment.title || "assignment"}`;
    const slug = slugBase
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "submissions";
    return `/assignments/${assignment.id}/submissions/${slug}`;
  };

  const handleExtendDueDate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedAssignment || !extendedDueDate) {
      setError("Please choose a new due date.");
      return;
    }

    const currentDateOnly = toDateInputValue(selectedAssignment.dueDate);
    if (extendedDueDate <= currentDateOnly) {
      setError("New due date must be later than current due date.");
      return;
    }

    setExtending(true);
    try {
      await extendTeacherAssignmentDueDate(selectedAssignment.id, extendedDueDate);
      await loadAssignments();
      setSuccess("Submission deadline extended successfully.");
      closeExtendModal();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to extend due date");
    } finally {
      setExtending(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white p-10 rounded-4xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Assignment Manager</h1>
          <p className="text-slate-500 font-medium">Create and track real assignments for your classes (8 to 10, A to D).</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 hover:scale-105 transition-all shadow-lg shadow-indigo-100"
        >
          <span>+</span> New Assignment
        </button>
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

      {loading ? (
        <div className="bg-white p-10 rounded-4xl border border-slate-100 shadow-sm font-black text-slate-500 animate-pulse">
          Loading assignments...
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white p-10 rounded-4xl border border-slate-100 shadow-sm text-slate-500 font-semibold">
          No assignments created yet. Click <span className="font-black">New Assignment</span> to publish one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {assignments.map((task) => (
            <div
              key={task.id}
              className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm hover:border-indigo-300 transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-indigo-50 transition-colors">{"\u{1F4C4}"}</div>
                <span
                  className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                    task.status === "Active" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {task.status}
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-800">{task.title}</h3>
              <p className="text-slate-500 text-sm mt-2 line-clamp-2">{task.description}</p>
              <p className="text-slate-400 text-[10px] font-black mt-3 uppercase tracking-widest">
                Class: {task.classAssigned}
              </p>
              <p className="text-slate-400 text-[10px] font-black mt-1 uppercase tracking-widest">
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </p>

              <div className="mt-8 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Submissions</p>
                  <p className="text-xl font-black text-slate-900">
                    {task.submissions} <span className="text-slate-300">/ {task.totalStudents}</span>
                  </p>
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Pending: {task.pendingCount}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => navigate(buildSubmissionPath(task))}
                  className="w-full py-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors"
                >
                  View Submissions
                </button>
                <button
                  type="button"
                  onClick={() => openExtendModal(task)}
                  className="w-full py-3 bg-sky-50 text-sky-700 border border-sky-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-sky-100 transition-colors"
                >
                  Extend Due Date
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-4xl p-10 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-slate-900 mb-6">New Assignment</h2>

            <form className="space-y-4" onSubmit={handleCreateAssignment}>
              <input
                type="text"
                placeholder="Assignment Title"
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-slate-800"
              />

              <textarea
                placeholder="Assignment Description"
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                rows={4}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none resize-none text-slate-800"
              />

              <select
                value={form.classAssigned}
                onChange={(e) => updateForm("classAssigned", e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-slate-800"
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                  Submission Due Date
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  min={minDueDate}
                  onChange={(e) => updateForm("dueDate", e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-slate-800"
                />
              </div>

              <input
                type="file"
                accept=".pdf,image/png,image/jpeg"
                onChange={(e) => updateForm("file", e.target.files?.[0] || null)}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-slate-800"
              />

              <div className="mt-8 flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 py-4 text-slate-400 font-bold uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase text-xs shadow-lg disabled:opacity-60"
                >
                  {submitting ? "Publishing..." : "Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExtendModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-4xl p-10 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Extend Submission Date</h2>
            <p className="text-slate-500 text-sm font-medium mb-6">
              Assignment: <span className="font-black text-slate-800">{selectedAssignment.title}</span>
            </p>

            <form className="space-y-4" onSubmit={handleExtendDueDate}>
              <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                Current Due Date: {new Date(selectedAssignment.dueDate).toLocaleDateString()}
              </div>

              <input
                type="date"
                value={extendedDueDate}
                min={minDueDate}
                onChange={(e) => setExtendedDueDate(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-slate-700"
              />

              <div className="mt-8 flex gap-4">
                <button
                  type="button"
                  onClick={closeExtendModal}
                  className="flex-1 py-4 text-slate-400 font-bold uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={extending}
                  className="flex-1 py-4 bg-sky-600 text-white rounded-2xl font-bold uppercase text-xs shadow-lg disabled:opacity-60"
                >
                  {extending ? "Updating..." : "Extend"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignments;

