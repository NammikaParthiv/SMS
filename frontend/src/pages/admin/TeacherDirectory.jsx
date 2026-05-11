import React, { useMemo } from "react";
import {
  approveTeacherAccess,
  createTeacherAllocation,
  deleteTeacherAccount,
  fetchAllTeachers,
  fetchAllowedClasses,
  fetchPendingTeacherApprovals,
  fetchTeacherAllocations,
} from "../../api/axios";

const formatCap = (value) => {
  const text = String(value || "").trim();
  if (!text) return "N/A";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const TeacherDirectory = () => {
  const [teachers, setTeachers] = React.useState([]);
  const [allocations, setAllocations] = React.useState([]);
  const [pendingApprovals, setPendingApprovals] = React.useState([]);
  const [classes, setClasses] = React.useState([]);
  const [selectedClasses, setSelectedClasses] = React.useState({});
  const [searchTerm, setSearchTerm] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [allocatingId, setAllocatingId] = React.useState("");
  const [deletingId, setDeletingId] = React.useState("");
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [teacherRes, allocationRes, pendingRes, classesRes] = await Promise.all([
        fetchAllTeachers(),
        fetchTeacherAllocations(),
        fetchPendingTeacherApprovals(),
        fetchAllowedClasses(),
      ]);

      setTeachers(teacherRes.data || []);
      setAllocations(allocationRes.data?.items || []);
      setPendingApprovals(pendingRes.data?.items || []);
      setClasses(classesRes.data?.classes || []);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load teachers");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleAllocateTeacher = async (teacher) => {
    const classList = selectedClasses[teacher.id] || [];
    const subject = String(teacher.teacherSubject || "").trim();

    if (classList.length === 0) {
      setError(`Select at least one class to allot ${teacher.name}.`);
      return;
    }

    if (!subject) {
      setError(`Teacher subject is missing for ${teacher.name}.`);
      return;
    }

    setAllocatingId(teacher.id);
    setError("");
    setSuccess("");

    try {
      await Promise.all(
        classList.map((classAssigned) =>
          createTeacherAllocation({
            teacherId: teacher.id,
            classAssigned,
            subject,
          }),
        ),
      );
      await approveTeacherAccess(teacher.id);
      setSuccess("Teacher allotted and approved successfully.");
      setSelectedClasses((prev) => {
        const next = { ...prev };
        delete next[teacher.id];
        return next;
      });
      await load();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to allot teacher");
    } finally {
      setAllocatingId("");
    }
  };

  const allocationMap = useMemo(() => {
    const map = new Map();

    allocations.forEach((row) => {
      const teacherId = row.teacher?.id;
      if (!teacherId) return;

      if (!map.has(teacherId)) {
        map.set(teacherId, {
          classes: new Set(),
          subjects: new Set(),
        });
      }

      map.get(teacherId).classes.add(row.classAssigned);
      map.get(teacherId).subjects.add(row.subject);
    });

    return map;
  }, [allocations]);

  const filtered = useMemo(
    () =>
      teachers.filter((t) =>
        [t.name, t.email, t.teacherSubject]
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      ),
    [teachers, searchTerm],
  );

  const handleDeleteTeacher = async (teacher) => {
    const confirmed = window.confirm(`Delete ${teacher.name}? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(teacher.id || teacher._id);
    setError("");
    setSuccess("");

    try {
      await deleteTeacherAccount(teacher.id || teacher._id);
      setSuccess("Teacher deleted.");
      await load();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to delete teacher");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Teacher Directory</h1>
          <p className="text-sm text-slate-500 font-medium mt-2">
            Active teachers are listed here. Pending registrations appear in approval requests.
          </p>
        </div>
          <input
            type="text"
            placeholder="Search teacher..."
            className="pl-6 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-80 font-bold text-sm text-slate-800 placeholder:text-[#696969]"
            onChange={(e) => setSearchTerm(e.target.value)}
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
            <p className="text-sm text-slate-500 font-medium">New teacher registration notifications</p>
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-indigo-600">
            Pending: {pendingApprovals.length}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-slate-500 font-black animate-pulse">Loading approvals...</div>
        ) : pendingApprovals.length === 0 ? (
          <div className="p-8 text-slate-500 font-semibold">No pending teacher approval requests.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingApprovals.map((teacher) => (
              <div key={teacher.id} className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="font-black text-slate-900">{teacher.name}</p>
                  <p className="text-sm text-slate-500 font-medium">{teacher.email}</p>
                  <p className="text-xs text-slate-400 font-semibold">Password: Hidden for security</p>
                  <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">
                    Subject: {formatCap(teacher.teacherSubject)}
                  </p>
                </div>

                <div className="flex flex-col items-start gap-3">
                  <div className="flex flex-wrap gap-2">
                    {classes.map((cls) => {
                      const selected = (selectedClasses[teacher.id] || []).includes(cls);
                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() =>
                            setSelectedClasses((prev) => {
                              const current = prev[teacher.id] || [];
                              const next = selected
                                ? current.filter((item) => item !== cls)
                                : [...current, cls];
                              return { ...prev, [teacher.id]: next };
                            })
                          }
                          className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-colors ${
                            selected
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {cls}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAllocateTeacher(teacher)}
                    disabled={allocatingId === teacher.id}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {allocatingId === teacher.id ? "Allotting..." : "Allot & Approve"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteTeacher(teacher)}
                    disabled={deletingId === teacher.id}
                    className="px-6 py-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-100 disabled:opacity-60"
                  >
                    {deletingId === teacher.id ? "Deleting..." : "Delete Request"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-slate-500 font-black animate-pulse">Loading teachers...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-slate-500 font-semibold">No teacher found.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Teacher</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Email</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Classes</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Allocation Subjects</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((teacher) => {
                const stats = allocationMap.get(teacher._id);
                const classes = stats ? Array.from(stats.classes).sort((a, b) => a.localeCompare(b)) : [];
                const subjects = stats ? Array.from(stats.subjects).sort((a, b) => a.localeCompare(b)) : [];

                return (
                  <tr key={teacher._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6 font-bold text-slate-800">{teacher.name}</td>
                    <td className="p-6 text-sm font-medium text-slate-500">{teacher.email}</td>
                    <td className="p-6 text-sm font-semibold text-slate-700">{formatCap(teacher.teacherSubject)}</td>
                    <td className="p-6 text-sm font-black text-indigo-600">
                      {classes.length ? classes.join(", ") : "Not Allocated"}
                    </td>
                    <td className="p-6 text-sm text-slate-600 font-semibold">
                      {subjects.length ? subjects.join(", ") : "Not Allocated"}
                    </td>
                    <td className="p-6 text-right">
                      <button
                        onClick={() => handleDeleteTeacher(teacher)}
                        className="text-[10px] font-black uppercase tracking-widest text-rose-600 hover:underline"
                        disabled={deletingId === teacher._id}
                      >
                        {deletingId === teacher._id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TeacherDirectory;
