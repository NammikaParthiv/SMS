import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  fetchMyNotifications,
  markNotificationRead,
  deleteNotification,
} from "../api/axios";

const Home = () => {
  const { auth } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const role = auth?.role?.toLowerCase();
  const isStudent = role === "student";
  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";
  const showNotifications = isStudent || isAdmin || isTeacher;

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
      <div className="bg-white/80 backdrop-blur p-10 rounded-4xl border border-slate-100 shadow-sm">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
          Welcome to the Pyramid School, <span className="text-indigo-600">{auth?.name || "Guest"}</span>
        </h1>
        <p className="text-slate-500 mt-2 font-medium italic">
          Building bright futures together.
        </p>
      </div>

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
    </div>
  );
};

export default Home;
