import React, { useEffect, useMemo, useState } from "react";
import { fetchMyClassStudents, fetchMyTeachingClasses, updateMarks } from "../../api/axios";

const examTemplates = ["Unit Test 1", "Unit Test 2", "Mid-Term Exam", "Final Exam"];
const classPalette = ["bg-indigo-600", "bg-emerald-500", "bg-cyan-500", "bg-amber-500"];

const TeacherMarks = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");

  const [selectedExam, setSelectedExam] = useState("");
  const [customExamName, setCustomExamName] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");

  const [marksByStudent, setMarksByStudent] = useState({});
  const [savingByStudent, setSavingByStudent] = useState({});
  const [savedByStudent, setSavedByStudent] = useState({});
  const [rowErrors, setRowErrors] = useState({});
  const [savingClass, setSavingClass] = useState(false);
  const [savingMarked, setSavingMarked] = useState(false);

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
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
      setLoadingClasses(true);
      setError("");

      try {
        const res = await fetchMyTeachingClasses();
        setClasses(res.data?.items || []);
      } catch (err) {
        setError(err.response?.data?.msg || "Failed to load your classes");
      } finally {
        setLoadingClasses(false);
      }
    };

    loadClasses();
  }, []);

  const openClass = async (cls) => {
    setSelectedClass(cls);
    setLoadingStudents(true);
    setError("");

    setSelectedExam("");
    setCustomExamName("");
    setMarksByStudent({});
    setSavingByStudent({});
    setSavedByStudent({});
    setRowErrors({});
    setSavingClass(false);
    setSavingMarked(false);

    try {
      const res = await fetchMyClassStudents(cls.classAssigned);
      const studentItems = res.data?.items || [];
      const subjectItems = res.data?.subjects || cls.subjects || [];

      setStudents(studentItems);
      setSubjects(subjectItems);
      setSelectedSubject(subjectItems[0] || "");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load students for this class");
      setStudents([]);
      setSubjects([]);
      setSelectedSubject("");
    } finally {
      setLoadingStudents(false);
    }
  };

  const closeClass = () => {
    setSelectedClass(null);
    setStudents([]);
    setSubjects([]);
    setSelectedSubject("");

    setSelectedExam("");
    setCustomExamName("");
    setMarksByStudent({});
    setSavingByStudent({});
    setSavedByStudent({});
    setRowErrors({});
    setError("");
    setSavingClass(false);
    setSavingMarked(false);
  };

  const availableExamNames = useMemo(() => examTemplates, []);

  const selectExam = (examName) => {
    setSelectedExam(examName);
    setSavedByStudent({});
    setRowErrors({});
  };

  const applyCustomExam = () => {
    const value = customExamName.trim();
    if (!value) {
      setError("Please type an exam name.");
      return;
    }

    setError("");
    selectExam(value);
  };

  const updateStudentScore = (studentId, value) => {
    setMarksByStudent((prev) => ({ ...prev, [studentId]: value }));

    setSavedByStudent((prev) => {
      if (!prev[studentId]) return prev;
      const next = { ...prev };
      delete next[studentId];
      return next;
    });

    setRowErrors((prev) => {
      if (!prev[studentId]) return prev;
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
  };

  const saveClassMarks = async () => {
    setError("");
    setRowErrors({});

    if (!selectedExam) {
      setError("Please select an exam name first.");
      return;
    }

    if (!selectedSubject) {
      setError("No subject found for this class. Ask admin to allocate subject.");
      return;
    }

    const parsedMaxMarks = Number(maxMarks);
    if (Number.isNaN(parsedMaxMarks) || parsedMaxMarks <= 0) {
      setError("Max marks must be a valid number greater than 0.");
      return;
    }

    const missing = students.filter((student) => marksByStudent[student.id] === undefined || marksByStudent[student.id] === "");
    if (missing.length > 0) {
      setError("Please enter marks for all students before saving the class.");
      return;
    }

    const marksList = students.map((student) => ({
      studentId: student.id,
      marksObtained: Number(marksByStudent[student.id]),
    }));

    const invalid = marksList.find(
      (row) =>
        Number.isNaN(row.marksObtained) || row.marksObtained < 0 || row.marksObtained > parsedMaxMarks,
    );
    if (invalid) {
      setError(`Marks must be between 0 and ${parsedMaxMarks} for every student.`);
      return;
    }

    setSavingClass(true);
    try {
      await updateMarks({
        classAssigned: selectedClass.classAssigned,
        examName: selectedExam,
        subject: selectedSubject,
        maxMarks: parsedMaxMarks,
        marksList,
      });
      const savedMap = {};
      students.forEach((student) => {
        savedMap[student.id] = true;
      });
      setSavedByStudent(savedMap);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to save class marks");
    } finally {
      setSavingClass(false);
    }
  };

  const saveMarkedStudents = async () => {
    setError("");
    setRowErrors({});

    if (!selectedExam) {
      setError("Please select an exam name first.");
      return;
    }

    if (!selectedSubject) {
      setError("No subject found for this class. Ask admin to allocate subject.");
      return;
    }

    const parsedMaxMarks = Number(maxMarks);
    if (Number.isNaN(parsedMaxMarks) || parsedMaxMarks <= 0) {
      setError("Max marks must be a valid number greater than 0.");
      return;
    }

    const markedRows = students
      .map((student) => ({
        studentId: student.id,
        marksObtained: marksByStudent[student.id],
      }))
      .filter((row) => row.marksObtained !== undefined && row.marksObtained !== null && row.marksObtained !== "");

    if (markedRows.length === 0) {
      setError("Enter marks for at least one student to use bulk update.");
      return;
    }

    const marksList = markedRows.map((row) => ({
      studentId: row.studentId,
      marksObtained: Number(row.marksObtained),
    }));

    const invalid = marksList.find(
      (row) =>
        Number.isNaN(row.marksObtained) || row.marksObtained < 0 || row.marksObtained > parsedMaxMarks,
    );
    if (invalid) {
      setError(`Marks must be between 0 and ${parsedMaxMarks} for each marked student.`);
      return;
    }

    setSavingMarked(true);
    try {
      await updateMarks({
        classAssigned: selectedClass.classAssigned,
        examName: selectedExam,
        subject: selectedSubject,
        maxMarks: parsedMaxMarks,
        marksList,
      });

      setSavedByStudent((prev) => {
        const next = { ...prev };
        marksList.forEach((row) => {
          next[row.studentId] = true;
        });
        return next;
      });
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to save selected marks");
    } finally {
      setSavingMarked(false);
    }
  };

  const saveStudentMarks = async (student) => {
    setError("");

    const markValue = marksByStudent[student.id];
    const parsedMark = Number(markValue);
    const parsedMaxMarks = Number(maxMarks);

    if (!selectedExam) {
      setError("Please select an exam name first.");
      return;
    }

    if (!selectedSubject) {
      setError("No subject found for this class. Ask admin to allocate subject.");
      return;
    }

    if (Number.isNaN(parsedMaxMarks) || parsedMaxMarks <= 0) {
      setError("Max marks must be a valid number greater than 0.");
      return;
    }

    if (markValue === "" || Number.isNaN(parsedMark) || parsedMark < 0 || parsedMark > parsedMaxMarks) {
      setRowErrors((prev) => ({
        ...prev,
        [student.id]: `Enter valid marks between 0 and ${parsedMaxMarks}.`,
      }));
      return;
    }

    setSavingByStudent((prev) => ({ ...prev, [student.id]: true }));

    try {
      await updateMarks({
        studentId: student.id,
        classAssigned: selectedClass.classAssigned,
        examName: selectedExam,
        subject: selectedSubject,
        marksObtained: parsedMark,
        maxMarks: parsedMaxMarks,
      });

      setSavedByStudent((prev) => ({ ...prev, [student.id]: true }));
      setRowErrors((prev) => {
        if (!prev[student.id]) return prev;
        const next = { ...prev };
        delete next[student.id];
        return next;
      });
    } catch (err) {
      setRowErrors((prev) => ({
        ...prev,
        [student.id]: err.response?.data?.msg || "Failed to save marks",
      }));
    } finally {
      setSavingByStudent((prev) => ({ ...prev, [student.id]: false }));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white p-10 rounded-4xl border border-slate-100 shadow-sm">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">Upload Marks</h1>
        <p className="text-slate-500 font-medium mt-2">
          Select class, then exam, and update marks student-wise.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-2xl text-sm font-bold">
          {error}
        </div>
      )}

      {!selectedClass ? (
        loadingClasses ? (
          <div className="bg-white p-10 rounded-4xl border border-slate-100 shadow-sm text-slate-500 font-black animate-pulse">
            Loading classes...
          </div>
        ) : classes.length === 0 ? (
          <div className="bg-white p-10 rounded-4xl border border-slate-100 shadow-sm text-slate-500 font-semibold">
            No class allocation found yet. Ask admin to allocate class and subject.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {classes.map((cls, index) => (
              <button
                key={cls.classAssigned}
                type="button"
                onClick={() => openClass(cls)}
                className="group relative bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left"
              >
                <div
                  className={`w-12 h-12 ${classPalette[index % classPalette.length]} rounded-2xl mb-6 flex items-center justify-center text-white shadow-lg font-black`}
                >
                  {cls.classAssigned}
                </div>

                <h2 className="text-2xl font-black text-slate-900">Class {cls.classAssigned}</h2>
                <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-2">
                  {cls.subjects?.join(" | ") || "No subjects"}
                </p>

                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700">
                    Students: <span className="font-black">{cls.studentsCount}</span>
                  </p>
                  <span className="text-[10px] bg-slate-900 text-white px-4 py-2 rounded-xl font-black uppercase tracking-widest group-hover:bg-indigo-600 transition-colors">
                    Open
                  </span>
                </div>
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-4xl border border-slate-100 shadow-sm p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Class {selectedClass.classAssigned}</h2>
                <p className="text-slate-500 text-sm font-medium mt-1">
                  Choose exam name, then update marks with a tick-confirmed save.
                </p>
              </div>
              <button
                type="button"
                onClick={closeClass}
                className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-widest hover:bg-slate-200"
              >
                Back to Classes
              </button>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                  Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none"
                >
                  {subjects.length === 0 ? (
                    <option value="">No Subject Allocated</option>
                  ) : (
                    subjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                  Max Marks
                </label>
                <input
                  type="number"
                  min="1"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(e.target.value)}
                  className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none"
                />
              </div>
            </div>

            <div className="mt-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Exam Name</p>
              <div className="flex flex-wrap gap-3">
                {availableExamNames.map((examName) => (
                  <button
                    key={examName}
                    type="button"
                    onClick={() => selectExam(examName)}
                    className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-colors ${
                      selectedExam === examName
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {examName}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={customExamName}
                  onChange={(e) => setCustomExamName(e.target.value)}
                  placeholder="Or type custom exam name"
                  className="flex-1 p-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none"
                />
                <button
                  type="button"
                  onClick={applyCustomExam}
                  className="px-6 py-4 bg-cyan-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-cyan-700"
                >
                  Use Exam Name
                </button>
              </div>

              {selectedExam && (
                <p className="mt-3 text-sm font-bold text-emerald-700">
                  Selected exam: <span className="font-black">{selectedExam}</span>
                </p>
              )}

              {selectedExam && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={saveMarkedStudents}
                    disabled={savingMarked}
                    className="px-6 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {savingMarked ? "Saving Marked..." : "Save Marked Students"}
                  </button>
                  <button
                    type="button"
                    onClick={saveClassMarks}
                    disabled={savingClass}
                    className="px-6 py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {savingClass ? "Saving Class..." : "Save Full Class Marks"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {!selectedExam ? (
            <div className="bg-white rounded-4xl border border-slate-100 shadow-sm p-8 text-slate-500 font-semibold">
              Select an exam name to view class members and upload marks.
            </div>
          ) : loadingStudents ? (
            <div className="bg-white rounded-4xl border border-slate-100 shadow-sm p-8 text-slate-500 font-black animate-pulse">
              Loading students...
            </div>
          ) : students.length === 0 ? (
            <div className="bg-white rounded-4xl border border-slate-100 shadow-sm p-8 text-slate-500 font-semibold">
              No students found in this class.
            </div>
          ) : (
            <div className="bg-sky-50 rounded-4xl border border-sky-100 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 border-b border-sky-100 text-center">
                <h3 className="text-2xl font-black text-slate-900">Class Members</h3>
                <p className="text-slate-600 text-sm font-semibold mt-1">
                  Enter marks and click update. A tick appears beside the student name after save.
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {students.map((student) => (
                  <div key={student.id} className="p-5 md:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <p className="text-slate-900 font-extrabold text-lg">{student.name}</p>
                        {savedByStudent[student.id] && (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-black">
                            {"\u2713"}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-black text-indigo-700">
                        Roll: {renderRoll(student.rollNumber, student.classAssigned)}
                      </span>
                      {rowErrors[student.id] && (
                        <p className="text-xs text-rose-600 font-bold mt-1">{rowErrors[student.id]}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                      <input
                        type="number"
                        min="0"
                        max={Number(maxMarks) > 0 ? maxMarks : undefined}
                        value={marksByStudent[student.id] ?? ""}
                        onChange={(e) => updateStudentScore(student.id, e.target.value)}
                        placeholder="Score"
                        className="w-full lg:w-32 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => saveStudentMarks(student)}
                        disabled={!!savingByStudent[student.id]}
                        className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-60"
                      >
                        {savingByStudent[student.id] ? "Saving..." : "Update"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherMarks;

