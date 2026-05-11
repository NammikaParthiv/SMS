import React, { useEffect, useState } from "react";
import {
  createTeacherAllocation,
  deleteTeacherAllocation,
  deleteClassData,
  fetchAllTeachers,
  fetchAllowedClasses,
  fetchTeacherAllocations,
} from "../../api/axios";
import { SUBJECTS, subjectLabel } from "../../constants/subjects";

const initialForm = {
  teacherId: "",
  classAssigned: "",
  subject: "",
};

const AdminTeacherAllocations = () => {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [allocations, setAllocations] = useState([]);

  const [form, setForm] = useState(initialForm);
  const [deleteClass, setDeleteClass] = useState("");
  const [deletingClass, setDeletingClass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAllocations = async () => {
    const res = await fetchTeacherAllocations();
    setAllocations(res.data?.items || []);
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      setError("");

      try {
        const [teachersRes, classRes, allocationRes] = await Promise.all([
          fetchAllTeachers(),
          fetchAllowedClasses(),
          fetchTeacherAllocations(),
        ]);

        setTeachers(teachersRes.data || []);
        setClasses(classRes.data?.classes || []);
        setAllocations(allocationRes.data?.items || []);
      } catch (err) {
        setError(err.response?.data?.msg || "Failed to load allocation data");
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.teacherId || !form.classAssigned || !form.subject.trim()) {
      setError("Teacher, class, and subject are required");
      return;
    }

    setSubmitting(true);
    try {
      await createTeacherAllocation({
        teacherId: form.teacherId,
        classAssigned: form.classAssigned,
        subject: form.subject.trim(),
      });

      await loadAllocations();
      setSuccess("Teacher allocation created");
      setForm(initialForm);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to create allocation");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id) => {
    setError("");
    setSuccess("");

    try {
      await deleteTeacherAllocation(id);
      await loadAllocations();
      setSuccess("Allocation removed");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to remove allocation");
    }
  };

  const onDeleteClass = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!deleteClass) {
      setError("Select a class to delete");
      return;
    }

    const confirmed = window.confirm(
      `Clear class ${deleteClass}? This will remove allocations, assignments, marks, and attendance for that class.`,
    );
    if (!confirmed) return;

    setDeletingClass(true);
    try {
      await deleteClassData(deleteClass);
      await loadAllocations();
      setSuccess(`Class ${deleteClass} cleared`);
      setDeleteClass("");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to clear class");
    } finally {
      setDeletingClass(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white p-10 rounded-4xl border border-slate-100 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Teacher Allocation</h1>
        <p className="text-slate-500 mt-2 font-medium">
          Assign teacher subjects to classes. This controls what appears in teacher My Classes.
        </p>
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

      <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-6">Create Allocation</h2>

        <form className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={onCreate}>
          <select
            value={form.teacherId}
            onChange={(e) => updateForm("teacherId", e.target.value)}
            className="p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-800 placeholder:text-[#696969]"
          >
            <option value="">Select Teacher</option>
            {teachers.map((teacher) => (
              <option key={teacher._id} value={teacher._id}>
                {teacher.name}
              </option>
            ))}
          </select>

          <select
            value={form.classAssigned}
            onChange={(e) => updateForm("classAssigned", e.target.value)}
            className="p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-800 placeholder:text-[#696969]"
          >
            <option value="">Select Class</option>
            {classes.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>

          <select
            value={form.subject}
            onChange={(e) => updateForm("subject", e.target.value)}
            className="p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-800 placeholder:text-[#696969]"
          >
            <option value="">Select Subject</option>
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subjectLabel(subject)}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 text-white rounded-2xl font-bold uppercase text-xs tracking-widest disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </form>
      </div>

      <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-6">Delete Class Data</h2>
        <form className="flex flex-col md:flex-row gap-4" onSubmit={onDeleteClass}>
          <select
            value={deleteClass}
            onChange={(e) => setDeleteClass(e.target.value)}
            className="p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-800 placeholder:text-[#696969]"
          >
            <option value="">Select Class</option>
            {classes.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={deletingClass}
            className="bg-rose-600 text-white rounded-2xl font-bold uppercase text-xs tracking-widest px-6 py-4 disabled:opacity-60"
          >
            {deletingClass ? "Deleting..." : "Delete Class Data"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-900">Current Allocations</h2>
        </div>

        {loading ? (
          <div className="p-8 text-slate-500 font-black animate-pulse">Loading allocations...</div>
        ) : allocations.length === 0 ? (
          <div className="p-8 text-slate-500 font-semibold">No teacher allocations yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                <tr>
                  <th className="p-5">Teacher</th>
                  <th className="p-5">Email</th>
                  <th className="p-5">Class</th>
                  <th className="p-5">Subject</th>
                  <th className="p-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allocations.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-5 font-bold text-slate-900">{row.teacher?.name || "N/A"}</td>
                    <td className="p-5 text-slate-500 text-sm">{row.teacher?.email || "N/A"}</td>
                    <td className="p-5 font-black text-indigo-600">{row.classAssigned}</td>
                    <td className="p-5 font-semibold text-slate-700">{row.subject}</td>
                    <td className="p-5 text-right">
                      <button
                        onClick={() => onDelete(row.id)}
                        className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-rose-50 text-rose-600 hover:bg-rose-100"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTeacherAllocations;
