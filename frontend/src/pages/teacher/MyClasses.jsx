import React, { useEffect, useState } from "react";
import { fetchMyClassStudents, fetchMyTeachingClasses } from "../../api/axios";

const palette = ["bg-indigo-600", "bg-emerald-500", "bg-rose-500", "bg-amber-500"];

const MyClasses = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState("");

  const renderRoll = (roll, cls) => {
    if (!roll) return "N/A";
    const rollStr = String(roll).trim();
    const clsStr = String(cls || "").trim();
    if (clsStr && rollStr.toLowerCase().startsWith(`${clsStr.toLowerCase()}-`)) {
      return rollStr.slice(clsStr.length + 1);
    }
    return rollStr;
  };

  useEffect(() => {
    const loadClasses = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetchMyTeachingClasses();
        setClasses(res.data?.items || []);
      } catch (err) {
        setError(err.response?.data?.msg || "Failed to load your classes");
      } finally {
        setLoading(false);
      }
    };

    loadClasses();
  }, []);

  const openClass = async (classAssigned) => {
    setSelectedClass(classAssigned);
    setStudentsLoading(true);
    setError("");

    try {
      const res = await fetchMyClassStudents(classAssigned);
      setStudents(res.data?.items || []);
      setSubjects(res.data?.subjects || []);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load students for this class");
      setStudents([]);
      setSubjects([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white p-10 rounded-4xl border border-slate-100 shadow-sm">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">My Classes</h1>
        <p className="text-slate-500 font-medium mt-2">
          Open a class to view students and your allocated subjects.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-2xl text-sm font-bold">
          {error}
        </div>
      )}

      {selectedClass ? (
        <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Class {selectedClass} Students</h2>
              <p className="text-slate-500 text-sm font-medium mt-1">
                Subjects: {subjects.length > 0 ? subjects.join(", ") : "Not Assigned"}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedClass(null);
                setStudents([]);
                setSubjects([]);
              }}
              className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-widest hover:bg-slate-200"
            >
              Back to Classes
            </button>
          </div>

          {studentsLoading ? (
            <div className="p-8 text-slate-500 font-black animate-pulse">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="p-8 text-slate-500 font-semibold">No students found in this class.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                  <tr>
                    <th className="p-5">Name</th>
                    <th className="p-5">Roll No</th>
                    <th className="p-5">Email</th>
                    <th className="p-5">Class</th>
                    <th className="p-5">Attendance %</th>
                    <th className="p-5">Submission %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-5 font-bold text-slate-900">{student.name}</td>
                      <td className="p-5 font-black text-slate-700">
                        {renderRoll(student.rollNumber, student.classAssigned)}
                      </td>
                      <td className="p-5 text-slate-500 text-sm">{student.email}</td>
                      <td className="p-5 font-black text-indigo-600">{student.classAssigned}</td>
                      <td className="p-5 text-slate-700 font-semibold">{student.attendancePercentage ?? 0}%</td>
                      <td className="p-5 text-slate-700 font-semibold">{student.submissionRate ?? 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="bg-white p-10 rounded-4xl border border-slate-100 shadow-sm text-slate-500 font-black animate-pulse">
          Loading classes...
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white p-10 rounded-4xl border border-slate-100 shadow-sm text-slate-500 font-semibold">
          No class allocation found for your account yet. Ask admin to allocate class and subject.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {classes.map((cls, index) => (
            <div
              key={cls.classAssigned}
              onClick={() => openClass(cls.classAssigned)}
              className="group relative bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer overflow-hidden"
            >
              <div
                className={`absolute -right-10 -top-10 w-32 h-32 ${palette[index % palette.length]} opacity-10 rounded-full group-hover:scale-150 transition-transform duration-700`}
              ></div>

              <div
                className={`w-12 h-12 ${palette[index % palette.length]} rounded-2xl mb-6 flex items-center justify-center text-white shadow-lg`}
              >
                <span className="font-black text-sm">{cls.classAssigned}</span>
              </div>

              <h3 className="text-2xl font-black text-slate-800 mb-2">Class {cls.classAssigned}</h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-3">
                {cls.subjects.join(" | ")}
              </p>

              <div className="flex items-center justify-between border-t border-slate-50 pt-6">
                <div className="flex flex-col">
                  <span className="text-slate-900 font-black text-lg">{cls.studentsCount}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                    Students
                  </span>
                </div>
                <button className="bg-slate-900 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest group-hover:bg-indigo-600 transition-colors">
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyClasses;
