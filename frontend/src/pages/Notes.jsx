import React, { useEffect, useMemo, useState } from "react";
import {
  fetchMyTeachingClasses,
  fetchStudentNotes,
  fetchTeacherNotes,
  uploadNote,
} from "../api/axios";
import { useAuth } from "../hooks/useAuth";
import { SUBJECTS, subjectLabelWithEmoji } from "../constants/subjects";

const formatCap = (value) => {
  const text = String(value || "").trim();
  if (!text) return "N/A";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const mapNotesBySubject = (groups = []) => {
  const mapped = {};
  groups.forEach((group) => {
    mapped[group.subject] = group.notes || [];
  });
  return mapped;
};

const Notes = () => {
  const { auth } = useAuth();
  const role = auth?.role?.toLowerCase();
  const isTeacher = role === "teacher";
  const isStudent = role === "student";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [teacherClasses, setTeacherClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [notesBySubject, setNotesBySubject] = useState({});

  const [selectedSubject, setSelectedSubject] = useState("");
  const [studentDetailView, setStudentDetailView] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadTeacherClasses = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchMyTeachingClasses();
      const items = res.data?.items || [];
      setTeacherClasses(items);
      setSelectedClass(items[0] || null);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load your classes");
      setTeacherClasses([]);
      setSelectedClass(null);
    } finally {
      setLoading(false);
    }
  };

  const loadTeacherNotes = async (classAssigned) => {
    if (!classAssigned) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetchTeacherNotes(classAssigned);
      const items = res.data?.items || [];
      const mapped = mapNotesBySubject(items);
      setNotesBySubject(mapped);
      const firstSubject = (res.data?.subjects && res.data.subjects[0]) || Object.keys(mapped)[0] || "";
      setSelectedSubject(firstSubject);
      setStudentDetailView(false);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load notes");
      setNotesBySubject({});
      setSelectedSubject("");
    } finally {
      setLoading(false);
    }
  };

  const loadStudentNotes = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchStudentNotes();
      const items = res.data?.items || [];
      const mapped = mapNotesBySubject(items);
      setNotesBySubject(mapped);
      const firstSubject = Object.keys(mapped)[0] || "";
      setSelectedSubject(firstSubject);
      setStudentDetailView(false);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load notes");
      setNotesBySubject({});
      setSelectedSubject("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isTeacher) {
      loadTeacherClasses();
    } else if (isStudent) {
      loadStudentNotes();
    }
  }, [isTeacher, isStudent]);

  useEffect(() => {
    if (isTeacher && selectedClass?.classAssigned) {
      loadTeacherNotes(selectedClass.classAssigned);
    }
  }, [isTeacher, selectedClass]);

  const availableSubjects = useMemo(() => {
    if (isTeacher && selectedClass?.subjects?.length) {
      return selectedClass.subjects;
    }
    return SUBJECTS;
  }, [isTeacher, selectedClass]);

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedClass?.classAssigned) {
      setError("Select a class first.");
      return;
    }

    if (!selectedSubject) {
      setError("Select a subject.");
      return;
    }

    if (!file) {
      setError("Please choose a PDF file.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("classAssigned", selectedClass.classAssigned);
      formData.append("subject", selectedSubject);
      formData.append("title", title.trim());
      formData.append("file", file);

      await uploadNote(formData);
      setSuccess("Note uploaded successfully.");
      setTitle("");
      setFile(null);
      await loadTeacherNotes(selectedClass.classAssigned);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to upload note");
    } finally {
      setUploading(false);
    }
  };

  if (!isTeacher && !isStudent) {
    return (
      <div className="bg-white p-10 rounded-4xl border border-slate-100 shadow-sm text-slate-500 font-semibold">
        Notes module is available for teachers and students only.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white p-10 rounded-4xl border border-slate-100 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Class Notes</h1>
        <p className="text-slate-500 mt-2 font-medium">
          {isTeacher
            ? "Upload PDF notes for your class and subject."
            : "View subject-wise notes shared by your teachers."}
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

      {isTeacher && (
        <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm space-y-6">
          {loading && !selectedClass ? (
            <div className="text-slate-500 font-black animate-pulse">Loading classes...</div>
          ) : teacherClasses.length === 0 ? (
            <div className="text-slate-500 font-semibold">
              No class allocation found. Ask admin to allot classes.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-3">
                {teacherClasses.map((cls) => (
                  <button
                    key={cls.classAssigned}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors ${
                      selectedClass?.classAssigned === cls.classAssigned
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Class {cls.classAssigned}
                  </button>
                ))}
              </div>

              <form className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end" onSubmit={handleUpload}>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Subject
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none text-slate-800 placeholder:text-[#696969]"
                  >
                    {availableSubjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {formatCap(subject)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Note Title (optional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none"
                    placeholder="Chapter 2 Notes"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <input
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none text-slate-800 placeholder:text-[#696969]"
                  />
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {uploading ? "Uploading..." : "Upload Note"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}

      <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm">
        {loading && !isTeacher ? (
          <div className="text-slate-500 font-black animate-pulse">Loading notes...</div>
        ) : isStudent ? (
          <div className="space-y-6">
            {!studentDetailView ? (
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Class Notes</p>
                {Object.keys(notesBySubject).length === 0 ? (
                  <p className="text-slate-500 font-semibold">No notes available yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                    {Object.keys(notesBySubject).map((subject) => (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => {
                          setSelectedSubject(subject);
                          setStudentDetailView(true);
                        }}
                        className="rounded-3xl p-10 h-56 border border-slate-200 bg-slate-50 hover:-translate-y-2 hover:shadow-xl transition-all flex flex-col justify-between text-left"
                      >
                        <span className="text-2xl font-black text-slate-900">{subjectLabelWithEmoji(subject)}</span>
                        <span className="text-sm font-black uppercase tracking-widest text-slate-600">
                          Notes: {notesBySubject[subject]?.length || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStudentDetailView(false)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-[11px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50"
                    >
                      Back
                    </button>
                    <h3 className="text-2xl font-black text-slate-900">
                      {subjectLabelWithEmoji(selectedSubject)} Notes
                    </h3>
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {notesBySubject[selectedSubject]?.length || 0} files
                  </span>
                </div>

                {(notesBySubject[selectedSubject] || []).length === 0 ? (
                  <p className="text-slate-500 font-semibold">No notes uploaded for this subject yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(notesBySubject[selectedSubject] || []).map((note) => (
                      <div
                        key={note.id}
                        className="rounded-3xl border border-slate-200 bg-slate-50 h-44 flex flex-col justify-between overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all"
                      >
                        <div className="p-4">
                          <p className="font-black text-slate-900 truncate">{note.title}</p>
                          <p className="text-[11px] text-slate-500 font-medium mt-2">
                            {new Date(note.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <a
                          href={note.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block w-full text-center bg-white border-t border-slate-200 py-3 text-[11px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50"
                        >
                          Open File
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {SUBJECTS.map((subject) => {
              const notes = notesBySubject[subject] || [];
              return (
                <div key={subject} className="border border-slate-100 rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black text-slate-900">{subjectLabelWithEmoji(subject)}</h3>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Notes: {notes.length}
                    </span>
                  </div>

                  {notes.length === 0 ? (
                    <p className="text-slate-500 text-sm font-medium">No notes uploaded yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {notes.map((note) => (
                        <div
                          key={note.id}
                          className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                        >
                          <div>
                            <p className="font-black text-slate-900">{note.title}</p>
                            <p className="text-xs text-slate-500 font-medium">
                              Shared by {note.uploadedBy} on {new Date(note.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <a
                            href={note.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline"
                          >
                            Download PDF
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;
