import React, { useEffect, useMemo, useState } from "react";
import {
  fetchClassAttendanceForDate,
  fetchMyAcademicAttendance,
  fetchMyTeachingClasses,
  saveClassAttendance,
} from "../api/axios";
import { useAuth } from "../hooks/useAuth";

const academicMonths = [
  { name: "July", index: 6, yearOffset: 0 },
  { name: "August", index: 7, yearOffset: 0 },
  { name: "September", index: 8, yearOffset: 0 },
  { name: "October", index: 9, yearOffset: 0 },
  { name: "November", index: 10, yearOffset: 0 },
  { name: "December", index: 11, yearOffset: 0 },
  { name: "January", index: 0, yearOffset: 1 },
  { name: "February", index: 1, yearOffset: 1 },
  { name: "March", index: 2, yearOffset: 1 },
  { name: "April", index: 3, yearOffset: 1 },
  { name: "May", index: 4, yearOffset: 1 },
];

const getAcademicStartYear = (dateObj = new Date()) => {
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  return month >= 6 ? year : year - 1;
};

const getInitialMonthIndex = (dateObj = new Date()) => {
  const month = dateObj.getMonth();
  const yearOffset = month >= 6 ? 0 : 1;
  const foundIndex = academicMonths.findIndex((m) => m.index === month && m.yearOffset === yearOffset);
  return foundIndex >= 0 ? foundIndex : 0;
};

const todayUtc = () => {
  const now = new Date();
  const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return utc.toISOString().split("T")[0];
};

const buildDayKey = (year, month, day) =>
  new Date(Date.UTC(year, month, day, 0, 0, 0, 0)).toISOString().split("T")[0];

const Attendance = () => {
  const { auth } = useAuth();
  const role = auth?.role?.toLowerCase();

  const isTeacher = role === "teacher";
  const isStudent = role === "student";

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [teacherClasses, setTeacherClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const todayInput = todayUtc();
  const [selectedDate] = useState(todayInput);
  const [classStudents, setClassStudents] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingClassRecords, setLoadingClassRecords] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  const [academicStartYear] = useState(getAcademicStartYear(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(getInitialMonthIndex(new Date()));
  const [statusByDate, setStatusByDate] = useState({});
  const [studentTotals, setStudentTotals] = useState({
    present: 0,
    absent: 0,
    totalMarkedDays: 0,
    percentage: 0,
  });
  const [loadingStudentRecords, setLoadingStudentRecords] = useState(false);

  useEffect(() => {
    const loadTeacherClasses = async () => {
      if (!isTeacher) return;

      setLoadingClasses(true);
      setError("");

      try {
        const res = await fetchMyTeachingClasses();
        const items = res.data?.items || [];
        setTeacherClasses(items);
        setSelectedClass(items[0]?.classAssigned || "");
      } catch (err) {
        setError(err.response?.data?.msg || "Failed to load your classes");
        setTeacherClasses([]);
      } finally {
        setLoadingClasses(false);
      }
    };

    loadTeacherClasses();
  }, [isTeacher]);

  useEffect(() => {
    const loadClassAttendance = async () => {
      if (!isTeacher || !selectedClass || !selectedDate) return;

      setLoadingClassRecords(true);
      setError("");
      setSuccess("");

      try {
        const res = await fetchClassAttendanceForDate(selectedClass, selectedDate);
        setClassStudents((res.data?.items || []).map((student) => ({ ...student, status: student.status || null })));
      } catch (err) {
        setError(err.response?.data?.msg || "Failed to load attendance records");
        setClassStudents([]);
      } finally {
        setLoadingClassRecords(false);
      }
    };

    loadClassAttendance();
  }, [isTeacher, selectedClass, selectedDate]);

  useEffect(() => {
    const loadStudentAttendance = async () => {
      if (!isStudent) return;

      setLoadingStudentRecords(true);
      setError("");

      try {
        const res = await fetchMyAcademicAttendance(academicStartYear);
        setStatusByDate(res.data?.statusByDate || {});
        setStudentTotals(
          res.data?.totals || {
            present: 0,
            absent: 0,
            totalMarkedDays: 0,
            percentage: 0,
          },
        );
      } catch (err) {
        setError(err.response?.data?.msg || "Failed to load attendance");
        setStatusByDate({});
        setStudentTotals({ present: 0, absent: 0, totalMarkedDays: 0, percentage: 0 });
      } finally {
        setLoadingStudentRecords(false);
      }
    };

    loadStudentAttendance();
  }, [isStudent, academicStartYear]);

  const setStudentStatus = (studentId, status) => {
    setClassStudents((prev) =>
      prev.map((student) => (student.id === studentId ? { ...student, status } : student)),
    );
  };

  const teacherStats = useMemo(() => {
    const present = classStudents.filter((s) => s.status === "present").length;
    const absent = classStudents.filter((s) => s.status === "absent").length;
    const unmarked = classStudents.length - present - absent;
    return { present, absent, unmarked };
  }, [classStudents]);

  const saveAttendance = async () => {
    setError("");
    setSuccess("");

    if (!selectedClass) {
      setError("Please select a class.");
      return;
    }

    if (!selectedDate) {
      setError("Please select a date.");
      return;
    }

    const hasUnmarked = classStudents.some((student) => !student.status);
    if (hasUnmarked) {
      setError("Please mark all students as present or absent before saving.");
      return;
    }

    const payload = {
      classAssigned: selectedClass,
      date: selectedDate,
      AttendanceList: classStudents.map((student) => ({
        studentId: student.id,
        status: student.status,
      })),
    };

    setSavingAttendance(true);

    try {
      await saveClassAttendance(payload);
      setSuccess("Attendance saved successfully.");

      const refreshed = await fetchClassAttendanceForDate(selectedClass, selectedDate);
      setClassStudents((refreshed.data?.items || []).map((student) => ({ ...student, status: student.status || null })));
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to save attendance");
    } finally {
      setSavingAttendance(false);
    }
  };


  const markAllPresent = () => {
    if (classStudents.length === 0) return;
    setClassStudents((prev) => prev.map((student) => ({ ...student, status: 'present' })));
  };

  const monthData = academicMonths[selectedMonth];
  const displayYear = academicStartYear + monthData.yearOffset;
  const daysInMonth = new Date(displayYear, monthData.index + 1, 0).getDate();
  const firstDay = new Date(displayYear, monthData.index, 1).getDay();
  const startingContent = firstDay === 0 ? 6 : firstDay - 1;

  const getDayStatus = (day) => {
    const dayKey = buildDayKey(displayYear, monthData.index, day);
    return statusByDate[dayKey] || "none";
  };

  if (!isTeacher && !isStudent) {
    return (
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm text-slate-500 font-semibold">
        Attendance module is available for teachers and students only.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
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

      {isTeacher ? (
        <>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-5 md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900">Class Attendance</h1>
              <p className="text-slate-500 text-sm font-medium mt-2">
                Select class and mark attendance for today only.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-sm outline-none text-slate-800 placeholder:text-[#696969]"
                disabled={loadingClasses || teacherClasses.length === 0}
              >
                {teacherClasses.length === 0 ? (
                  <option value="">No Class Assigned</option>
                ) : (
                  teacherClasses.map((cls) => (
                    <option key={cls.classAssigned} value={cls.classAssigned}>
                      Class {cls.classAssigned}
                    </option>
                  ))
                )}
              </select>

              <input
                type="date"
                value={selectedDate}
                min={todayInput}
                max={todayInput}
                readOnly
                className="px-4 py-3 rounded-2xl border border-slate-200 bg-slate-100 font-bold text-sm text-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Present</p>
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-black text-emerald-600">{teacherStats.present}</h2>
                <span className="text-2xl">{"\u2713"}</span>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Absent</p>
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-black text-rose-600">{teacherStats.absent}</h2>
                <span className="text-2xl">{"\u2715"}</span>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Unmarked</p>
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-black text-slate-500">{teacherStats.unmarked}</h2>
                <span className="text-2xl">�</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
              <h2 className="text-2xl font-black text-slate-900">Students List</h2>
              <div className="flex gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={markAllPresent}
                  disabled={loadingClassRecords || classStudents.length === 0}
                  className="px-5 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-200 hover:bg-emerald-100 disabled:opacity-60"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={saveAttendance}
                  disabled={savingAttendance || loadingClassRecords || classStudents.length === 0}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-60"
                >
                  {savingAttendance ? "Saving..." : "Save Attendance"}
                </button>
              </div>
            </div>

            {loadingClassRecords ? (
              <div className="text-slate-500 font-black animate-pulse">Loading class attendance...</div>
            ) : classStudents.length === 0 ? (
              <div className="text-slate-500 font-semibold">No students found in this class.</div>
            ) : (
              <div className="space-y-3">
                {classStudents.map((student) => (
                  <div
                    key={student.id}
                    className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div>
                      <p className="font-black text-slate-900">{student.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{student.email}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setStudentStatus(student.id, "present")}
                        className={`w-11 h-11 rounded-xl border-2 text-lg font-black transition-colors ${
                          student.status === "present"
                            ? "bg-emerald-500 border-emerald-600 text-white"
                            : "bg-white border-emerald-200 text-emerald-600"
                        }`}
                        title="Present"
                      >
                        {"\u2713"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentStatus(student.id, "absent")}
                        className={`w-11 h-11 rounded-xl border-2 text-lg font-black transition-colors ${
                          student.status === "absent"
                            ? "bg-rose-500 border-rose-600 text-white"
                            : "bg-white border-rose-200 text-rose-600"
                        }`}
                        title="Absent"
                      >
                        {"\u2715"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Present</p>
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-black text-emerald-600">{studentTotals.present}</h2>
                <span className="text-2xl">{"\u2713"}</span>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Absent</p>
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-black text-rose-600">{studentTotals.absent}</h2>
                <span className="text-2xl">{"\u2715"}</span>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Attendance %</p>
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-black text-indigo-600">{studentTotals.percentage}%</h2>
                <span className="text-2xl">%</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
              <h3 className="text-3xl font-black text-slate-800">
                Academic Session {academicStartYear}-{String(academicStartYear + 1).slice(-2)}
              </h3>

            </div>

            <div className="flex overflow-x-auto gap-2 pb-4 mb-10 no-scrollbar">
              {academicMonths.map((m, i) => (
                <button
                  key={m.name}
                  onClick={() => setSelectedMonth(i)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    selectedMonth === i
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105"
                      : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-end mb-8">
              <div>
                <h4 className="text-3xl font-black text-slate-800">
                  {monthData.name} {displayYear}
                </h4>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                  July to May calendar
                </p>
              </div>
              <div className="text-right hidden md:block">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Marked Days</span>
                <p className="font-bold text-slate-800">{studentTotals.totalMarkedDays}</p>
              </div>
            </div>

            {loadingStudentRecords ? (
              <div className="text-slate-500 font-black animate-pulse">Loading attendance calendar...</div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-3">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayName) => (
                    <div key={dayName} className="text-center text-[10px] font-black text-slate-300 uppercase mb-2">
                      {dayName}
                    </div>
                  ))}

                  {[...Array(startingContent)].map((_, i) => (
                    <div key={`blank-${i}`}></div>
                  ))}

                  {[...Array(daysInMonth)].map((_, i) => {
                    const day = i + 1;
                    const status = getDayStatus(day);

                    return (
                      <div
                        key={day}
                        className={`aspect-square rounded-2xl flex flex-col items-center justify-center border-2 transition-all cursor-default ${
                          status === "present"
                            ? "bg-emerald-500 border-emerald-600 shadow-sm"
                            : status === "absent"
                              ? "bg-rose-500 border-rose-600 shadow-sm"
                              : "bg-slate-200 border-slate-300"
                        }`}
                      >
                        <span className={`text-lg font-black ${status === "none" ? "text-slate-500" : "text-white"}`}>
                          {day}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-12 flex flex-wrap justify-center gap-8 border-t border-slate-50 pt-8">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-emerald-500 border-2 border-emerald-600 rounded-lg"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Present</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-rose-500 border-2 border-rose-600 rounded-lg"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Absent</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-slate-200 border-2 border-slate-300 rounded-lg"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No Record</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Attendance;


