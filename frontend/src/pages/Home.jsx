import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  fetchMyNotifications,
  markNotificationRead,
  deleteNotification,
} from "../api/axios";

const adminTools = [
  { icon: "👩‍🏫", title: "Teacher Directory", description: "Review teachers, their subjects, and access approvals.", color: "from-violet-600 to-indigo-600" },
  { icon: "🎓", title: "Student Records", description: "Browse class-wise student details and academic profiles.", color: "from-sky-500 to-cyan-500" },
  { icon: "🧩", title: "Class Allocation", description: "Assign every subject and class to the right teacher.", color: "from-amber-500 to-orange-500" },
  { icon: "📣", title: "School Notices", description: "Send important messages to selected school groups.", color: "from-emerald-500 to-teal-500" },
];

const teacherTools = [
  { icon: "🗓️", title: "Attendance", description: "Mark daily attendance for every allocated class.", color: "from-emerald-500 to-teal-500" },
  { icon: "📝", title: "Upload Marks", description: "Record exam scores and review student progress.", color: "from-indigo-600 to-violet-600" },
  { icon: "📚", title: "Class Notes", description: "Upload, rename, or manage study material for your classes.", color: "from-sky-500 to-cyan-500" },
  { icon: "📄", title: "Assignments", description: "Create assignments and review student submissions.", color: "from-amber-500 to-orange-500" },
];

const studentTools = [
  { icon: "📊", title: "My Marks", description: "Review published exam scores and subject performance.", color: "from-indigo-600 to-violet-600" },
  { icon: "✅", title: "Attendance", description: "Keep track of your class attendance record.", color: "from-emerald-500 to-teal-500" },
  { icon: "📘", title: "Study Notes", description: "Open notes shared by your teachers for every subject.", color: "from-sky-500 to-cyan-500" },
  { icon: "📄", title: "Assignments", description: "View work due dates and submit completed files.", color: "from-amber-500 to-orange-500" },
];

const Home = () => {
  const { auth } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const role = auth?.role?.toLowerCase();
  const isStudent = role === "student";
  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";
  const showNotifications = isStudent || isAdmin || isTeacher;
  const tools = isAdmin ? adminTools : isTeacher ? teacherTools : studentTools;
  const roleTitle = isAdmin ? "School command centre" : isTeacher ? "Teaching workspace" : "Student workspace";
  const welcomeTitle = isAdmin ? `Welcome, Admin ${auth?.name || ""}` : `Welcome to Pyramid School, ${auth?.name || "Guest"}`;
  const welcomeText = isAdmin
    ? "Manage people, classes, academic records, and school communication from one place."
    : isTeacher
      ? "Everything you need to guide your classes, record progress, and share learning material."
      : "Building bright futures together. Explore your learning tools and stay on top of school work.";

  useEffect(() => {
    const loadNotifications = async () => {
      if (!showNotifications) return;

      try {
        const res = await fetchMyNotifications({ limit: 5 });
        setNotifications(res.data?.items || []);
        setUnreadCount(res.data?.unreadCount || 0);
      } catch {
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    loadNotifications();
  }, [showNotifications]);

  const handleNotificationClick = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch {
      // Keep UX smooth if read sync fails.
    }
  };

  const handleNotificationDelete = async (notificationId, isRead) => {
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      if (!isRead) {
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }
    } catch {
      // fail silent to keep UI responsive
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {showNotifications && (
        <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {isAdmin ? "Admin Alerts" : "Notifications"}
            </h2>
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600">
              Unread: {unreadCount}
            </span>
          </div>

          {notifications.length === 0 ? (
            <div className="text-slate-500 font-medium">
              {isStudent || isTeacher
                ? "No new notifications right now."
                : "No new admin alerts right now."}
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((item) => (
                <div
                  key={item._id}
                  className={`w-full p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                    item.isRead
                      ? "bg-slate-50 border-slate-200 text-slate-600"
                      : "bg-indigo-50 border-indigo-200 text-slate-800"
                  }`}
                >
                  <button
                    onClick={() => handleNotificationClick(item._id)}
                    className="flex-1 text-left"
                  >
                    <p className="font-black text-lg leading-tight">{item.title}</p>
                    <p className="text-base mt-2 font-semibold">{item.message}</p>
                    <p className="text-[10px] uppercase tracking-widest mt-3 text-slate-400">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </button>
                  <button
                    aria-label="Delete notification"
                    onClick={() => handleNotificationDelete(item._id, item.isRead)}
                    className="shrink-0 px-3 py-2 rounded-xl bg-white border border-slate-200 text-rose-600 text-[11px] font-black uppercase tracking-widest hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <section className="relative overflow-hidden rounded-4xl bg-linear-to-br from-indigo-700 via-violet-700 to-sky-700 p-8 sm:p-10 text-white shadow-xl">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute right-20 bottom-0 h-32 w-32 rounded-full bg-cyan-300/15" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">{roleTitle}</p>
          <h1 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight">{welcomeTitle}</h1>
          <p className="mt-4 text-base leading-relaxed text-indigo-100">{welcomeText}</p>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-black text-slate-900">What you can do</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Use these tools from the sidebar whenever you need them.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {tools.map((tool) => (
            <div key={tool.title} className="group rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br ${tool.color} text-2xl shadow-lg`}>{tool.icon}</div>
              <h3 className="mt-5 font-black text-slate-900">{tool.title}</h3>
              <p className="mt-2 text-sm leading-relaxed font-medium text-slate-500">{tool.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
