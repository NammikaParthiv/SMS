import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  deleteStudentProfilePhoto,
  getMyStats,
  getStudentProfile,
  uploadStudentProfilePhoto,
} from "../../api/axios";
import { useAuth } from "../../hooks/useAuth";

const StudentProfile = () => {
  const { id } = useParams();
  const { auth } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showPhotoActions, setShowPhotoActions] = useState(false);
  const photoInputRef = useRef(null);

  const role = auth?.role?.toLowerCase();
  const isAdminObserver = role === "admin" && Boolean(id);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (id) {
          const response = await getStudentProfile(id);
          setStudent(response.data);
        } else {
          const response = await getMyStats();
          setStudent(response.data?.student || null);
        }
      } catch (error) {
        console.error("Error fetching student details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const examTrend = useMemo(() => {
    const marks = student?.marks || [];
    if (marks.length === 0) return [];
    const byExam = new Map();
    marks.forEach((m) => {
      const key = m.examName || "General";
      if (!byExam.has(key)) {
        byExam.set(key, {
          examName: key,
          totalObtained: 0,
          totalMax: 0,
          firstDate: m.createdAt || m.updatedAt || "",
        });
      }
      const entry = byExam.get(key);
      entry.totalObtained += Number(m.score || m.marksObtained || 0);
      entry.totalMax += Number(m.total || m.maxMarks || 0);
      if (m.createdAt && (!entry.firstDate || new Date(m.createdAt) < new Date(entry.firstDate))) {
        entry.firstDate = m.createdAt;
      }
    });

    return Array.from(byExam.values())
      .map((e) => ({
        name: e.examName,
        percent: e.totalMax ? Number(((e.totalObtained / e.totalMax) * 100).toFixed(1)) : 0,
        total: e.totalObtained,
        max: e.totalMax,
        date: e.firstDate,
      }))
      .sort((a, b) => (a.date && b.date ? new Date(a.date) - new Date(b.date) : a.name.localeCompare(b.name)));
  }, [student]);

  const targetStudentId = id || student?._id || auth?.id;
  const canEditPhoto =
    Boolean(targetStudentId) &&
    ((role === "admin" && Boolean(id)) || (role === "student" && !id));

  const handlePhotoClick = () => {
    if (!canEditPhoto || uploadingPhoto) return;
    setShowPhotoActions((prev) => !prev);
  };

  const handlePhotoChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !targetStudentId) return;

    const formData = new FormData();
    formData.append("photo", selectedFile);

    setUploadingPhoto(true);
    setUploadError("");

    try {
      const res = await uploadStudentProfilePhoto(targetStudentId, formData);
      const nextPhoto = res.data?.photo || res.data?.student?.photo;

      setStudent((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          photo: nextPhoto || prev.photo,
        };
      });
    } catch (err) {
      setUploadError(err.response?.data?.msg || "Failed to upload profile photo");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handlePhotoDelete = async () => {
    if (!canEditPhoto || !targetStudentId || deletingPhoto || uploadingPhoto) return;

    setDeletingPhoto(true);
    setUploadError("");

    try {
      await deleteStudentProfilePhoto(targetStudentId);
      setStudent((prev) => (prev ? { ...prev, photo: null } : prev));
    } catch (err) {
      setUploadError(err.response?.data?.msg || "Failed to remove profile photo");
    } finally {
      setDeletingPhoto(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse">LOADING PROFILE...</div>;
  if (!student) return <div className="p-20 text-center text-rose-500 font-black">STUDENT NOT FOUND</div>;

  const classLabel = student.classAssigned || student.class || "N/A";
  const rollLabel = student.rollNumber || student.rollNo || "N/A";
  const attendancePercent = Math.min(Math.max(Number(student.attendance || 0), 0), 100);
  const presentDays = student.attendancePresentDays ?? 0;
  const absentDays =
    student.attendanceAbsentDays ??
    Math.max((student.attendanceTotalDays || 0) - presentDays, 0);
  const circleSize = 220;
  const radius = 95;
  const cx = 110;
  const cy = 110;

  const degToRad = (deg) => (deg * Math.PI) / 180;
  const polarToCartesian = (centerX, centerY, r, angleInDegrees) => {
    const angleInRadians = degToRad(angleInDegrees - 90);
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (startAngle, endAngle) => {
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} L ${cx} ${cy} Z`;
  };

  const presentAngle = (attendancePercent / 100) * 360;
  const presentPath = describeArc(0, presentAngle || 0.01);
  const absentPath = describeArc(presentAngle, 360);
  const attendanceBackground =
    attendancePercent >= 100
      ? "#22c55e"
      : `conic-gradient(#22c55e 0deg ${presentAngle}deg, #ef4444 ${presentAngle}deg 360deg)`;

  const buildRing = (percent, color) => {
    const safePercent = Number.isFinite(percent) ? Math.min(Math.max(percent, 0), 100) : 0;
    const stroke = (safePercent / 100) * 2 * Math.PI * radius;
    const gap = Math.max(2 * Math.PI * radius - stroke, 0);
    return { stroke, gap, color };
  };

  const pendingTasks = Number(student.pendingTasks || 0);
  const pendingPercent = Math.min(pendingTasks * 10, 100); // scale 0-10+ tasks into ring
  const pendingRing = buildRing(pendingPercent, "#F59E0B");
  const dashOffsetStart = 0;
  const pendingCircleSize = 200;
  const pendingRadius = 72;

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {isAdminObserver && (
        <div className="observer-profile-banner">
          <p className="observer-profile-badge">Observer Mode</p>
          <p className="observer-profile-message">You are watching {student.name} profile</p>
        </div>
      )}

      <div className="relative bg-white p-12 rounded-[3rem] border border-slate-200 shadow-xl flex flex-col md:flex-row justify-between items-center overflow-hidden">
        <div className="relative z-10 text-center md:text-left">
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none uppercase">
            {student.name}
          </h1>
          <div className="mt-5 flex flex-col md:flex-row md:items-end md:gap-4">
            <p className="text-4xl md:text-5xl font-black text-indigo-600 uppercase leading-none">
              Class {classLabel}
            </p>
            <p className="text-xl font-extrabold text-slate-600 tracking-wide md:pb-1">
              Roll No: {rollLabel}
            </p>
          </div>
        </div>

        <div className="relative mt-8 md:mt-0 flex flex-col items-center gap-3">
          <div className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Roll No: {rollLabel}
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
            onChange={handlePhotoChange}
          />

          <button
            type="button"
            onClick={handlePhotoClick}
            disabled={!canEditPhoto || uploadingPhoto}
            className={`w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100 ${
              canEditPhoto ? "cursor-pointer" : "cursor-default"
            }`}
            title={canEditPhoto ? "Click to upload profile photo" : "Profile photo"}
          >
            {student.photo ? (
              <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
            ) : (
              <div className="default-profile-avatar">
                <div className="default-profile-avatar__ring"></div>
                <svg viewBox="0 0 24 24" className="default-profile-avatar__icon" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="8" r="3.1" />
                  <path d="M5.2 18.6C6.5 16.1 8.8 14.7 12 14.7C15.2 14.7 17.5 16.1 18.8 18.6" strokeLinecap="round" />
                </svg>
              </div>
            )}
          </button>

          {canEditPhoto && showPhotoActions && (
            <div className="flex flex-wrap justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto || deletingPhoto}
                className="px-3 py-2 rounded-full border border-slate-200 bg-white hover:border-indigo-400 transition disabled:opacity-50"
              >
                {uploadingPhoto ? "Uploading..." : "Update Photo"}
              </button>
              <button
                type="button"
                onClick={handlePhotoDelete}
                disabled={deletingPhoto || uploadingPhoto}
                className="px-3 py-2 rounded-full border border-rose-200 bg-white text-rose-600 hover:border-rose-400 transition disabled:opacity-50"
              >
                {deletingPhoto ? "Removing..." : "Delete Photo"}
              </button>
            </div>
          )}

          {uploadError && (
            <p className="text-[11px] font-semibold text-rose-600 text-center max-w-[170px]">{uploadError}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">
            Attendance
          </span>
          <div className="mt-6 flex items-center justify-center">
            <div
              className="relative rounded-full shadow-md"
              style={{
                width: circleSize,
                height: circleSize,
                background: attendanceBackground,
                transition: "transform 300ms",
              }}
            >
              <div className="absolute inset-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-3xl font-black text-slate-900">{attendancePercent}%</span>
              </div>
              <span className="sr-only">{`${presentDays} present, ${absentDays} absent`}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">
            Pending Submissions
          </span>
          <div className="mt-4 flex items-center justify-center">
            <svg
              width={pendingCircleSize}
              height={pendingCircleSize}
              viewBox="0 0 220 220"
              className="drop-shadow-sm transition-transform duration-300 hover:scale-105"
            >
              <circle cx="110" cy="110" r={pendingRadius} stroke="#E2E8F0" strokeWidth="14" fill="none" />
              <circle
                cx="110"
                cy="110"
                r={pendingRadius}
                stroke={pendingRing.color}
                strokeWidth="14"
                fill="none"
                strokeDasharray={`${pendingRing.stroke} ${pendingRing.gap}`}
                strokeDashoffset={dashOffsetStart}
                strokeLinecap="round"
                transform="rotate(-90 110 110)"
              >
                <title>{`${pendingTasks} pending task(s)`}</title>
              </circle>
              <text x="110" y="114" textAnchor="middle" className="fill-slate-900" style={{ fontSize: "26px", fontWeight: 900 }}>
                {pendingTasks}
              </text>
              <text
                x="110"
                y="134"
                textAnchor="middle"
                className="fill-slate-500"
                style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em" }}
              >
                PENDING
              </text>
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="text-sm md:text-base font-black text-indigo-500 uppercase tracking-widest">
            Average Marks
          </span>
          <span className="text-4xl font-black text-slate-900">{student.average || 0}%</span>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden flex-1">
            <div className="h-full bg-indigo-600" style={{ width: `${student.average || 0}%` }}></div>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Marks Analysis</h3>
            <p className="text-slate-500 text-sm font-medium">Exam-wise percentages (trend)</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl">
            {"\u{1F4CA}"}
          </div>
        </div>
        {examTrend.length === 0 ? (
          <p className="text-slate-500 font-semibold">No marks available to analyze.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            {(() => {
              const maxValue = Math.max(100, ...examTrend.map((d) => d.percent));
              const width = Math.max(420, examTrend.length * 160);
              const height = 260;
              const paddingX = 40;
              const paddingY = 28;
              const usableWidth = width - paddingX * 2;
              const usableHeight = height - paddingY * 2;
              const step = examTrend.length === 1 ? 0 : usableWidth / (examTrend.length - 1);

              const points = examTrend.map((d, i) => {
                const x = paddingX + i * step;
                const y = paddingY + (1 - d.percent / maxValue) * usableHeight;
                return { ...d, x, y };
              });

              const areaPath = [
                `M ${paddingX},${height - paddingY}`,
                ...points.map((p) => `L ${p.x},${p.y}`),
                `L ${paddingX + usableWidth},${height - paddingY}`,
                "Z",
              ].join(" ");

              return (
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="min-w-full">
                  <defs>
                    <linearGradient id="studentMarksGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity="0.06" />
                    </linearGradient>
                  </defs>

                  <rect x="0" y="0" width={width} height={height} fill="url(#studentMarksGradient)" opacity="0.08" />

                  <path d={areaPath} fill="url(#studentMarksGradient)" stroke="none" />
                  <polyline
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth="3"
                    points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                  />

                  {points.map((p, idx) => {
                    const prev = points[idx - 1];
                    const delta = prev ? Math.round((p.percent - prev.percent) * 10) / 10 : null;
                    return (
                      <g key={p.name} className="cursor-default">
                        <circle cx={p.x} cy={p.y} r={7} fill="#EEF2FF" stroke="#312E81" strokeWidth="2" />
                        <circle cx={p.x} cy={p.y} r={3.5} fill="#4F46E5" />
                        <text
                          x={p.x}
                          y={p.y - 14}
                          textAnchor="middle"
                          className="fill-slate-700"
                          style={{ fontSize: "11px", fontWeight: 800 }}
                        >
                          {p.percent}%
                        </text>
                        <text
                          x={p.x}
                          y={height - paddingY + 16}
                          textAnchor="middle"
                          className="fill-slate-500"
                          style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.15em" }}
                        >
                          {p.name}
                        </text>
                        {delta !== null && (
                          <text
                            x={p.x}
                            y={p.y - 30}
                            textAnchor="middle"
                            className={delta >= 0 ? "fill-emerald-600" : "fill-rose-600"}
                            style={{ fontSize: "10px", fontWeight: 800 }}
                          >
                            {delta >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(delta)}%
                          </text>
                        )}
                        <title>
                          {p.name}: {p.total}/{p.max} ({p.percent}%)
                        </title>
                      </g>
                    );
                  })}
                </svg>
              );
            })()}
          </div>
        )}
      </div>

      <div className="relative bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="max-w-md text-center md:text-left">
          <h2 className="text-3xl font-black tracking-tight mb-2 italic">Official Progress Report</h2>
          <p className="text-slate-400 font-medium">Verified by the Academic Department.</p>
        </div>

        <button
          onClick={() =>
            window.open(`${import.meta.env.VITE_API_URL}/student/report-card/${student._id}`, "_blank")
          }
          className="flex items-center gap-4 px-10 py-5 bg-white text-slate-900 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-indigo-500 hover:text-white transition-all shadow-xl"
        >
          Download Progress Card
        </button>
      </div>
    </div>
  );
};

export default StudentProfile;

