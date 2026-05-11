import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const SchoolLogo = ({ compact }) => {
  const sizeClass = compact ? "w-16 h-16" : "w-28 h-28";

  return (
    <div className={`${sizeClass} relative rounded-[2rem] shadow-2xl overflow-hidden`}>
      <svg viewBox="0 0 140 140" className="w-full h-full" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pyramid logo">
        <defs>
          <linearGradient id="pyrBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="pyrFaceSide" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#c7d2fe" />
          </linearGradient>
          <linearGradient id="pyrSideSide" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0b1224" />
          </linearGradient>
        </defs>

        <rect x="6" y="6" width="128" height="128" rx="34" fill="url(#pyrBg)" opacity="0.9" />
        <g transform="translate(20 24)">
          <polygon points="50,0 108,96 0,96" fill="url(#pyrFaceSide)" stroke="#e2e8f0" strokeWidth="3" />
          <polygon points="50,0 108,96 65,96" fill="url(#pyrSideSide)" opacity="0.9" />
          <polygon points="50,0 65,96 35,96" fill="#0b1224" opacity="0.16" />
          <circle cx="50" cy="36" r="7" fill="#22d3ee" opacity="0.9" />
        </g>
      </svg>
    </div>
  );
};

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { auth } = useAuth();

  const roleMenus = {
    admin: [
      { name: "Home", icon: "\u{1F3E0}", path: "/dashboard" },
      { name: "Profile", icon: "\u{1F464}", path: "/profile" },
      { name: "Teachers List", icon: "\u{1F468}\u200D\u{1F3EB}", path: "/admin/teachers" },
      { name: "Students List", icon: "\u{1F9D1}\u200D\u{1F393}", path: "/admin/students" },
      { name: "Global Marks", icon: "\u{1F4CA}", path: "/marks" },
      { name: "Teacher Allocation", icon: "\u{1F9E9}", path: "/admin/allocations" },
      { name: "Send Notification", icon: "\u{1F4E2}", path: "/admin/notifications" },
    ],
    teacher: [
      { name: "Home", icon: "\u{1F3E0}", path: "/dashboard" },
      { name: "Attendance", icon: "\u{1F4C5}", path: "/attendance" },
      { name: "Upload Marks", icon: "\u{1F4CA}", path: "/marks" },
      { name: "Assignments", icon: "\u{1F4C4}", path: "/assignments" },
      { name: "My Classes", icon: "\u{1F3EB}", path: "/teacher/classes" },
      { name: "Notes", icon: "\u{1F4D6}", path: "/notes" },
    ],
    student: [
      { name: "Home", icon: "\u{1F3E0}", path: "/dashboard" },
      { name: "Profile", icon: "\u{1F464}", path: "/profile" },
      { name: "Marks", icon: "\u{1F4CA}", path: "/marks" },
      { name: "Attendance", icon: "\u{1F4C5}", path: "/attendance" },
      { name: "Assignments", icon: "\u{1F4C4}", path: "/assignments" },
      { name: "Notes", icon: "\u{1F4D6}", path: "/notes" },
    ],
  };

  const menuItems = roleMenus[auth?.role?.toLowerCase()] || roleMenus.student;

  return (
    <div
      className={`${isOpen ? "w-72" : "w-24"} bg-[var(--erp-sidebar-bg)] text-[var(--erp-sidebar-text)] h-screen sticky top-0 transition-all duration-300 flex flex-col z-20 hover:cursor-pointer`}
    >
      <div className="px-4 pt-5 pb-5">
        <button
          type="button"
          className="w-full flex items-center justify-center cursor-pointer"
          onClick={() => navigate("/dashboard")}
          aria-label="Go to dashboard"
        >
          <SchoolLogo compact={!isOpen} />
        </button>
      </div>

      <nav className="flex-1 px-4 mt-3 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center h-14 px-4 rounded-2xl transition-all duration-200 group cursor-pointer ${
                isActive
                  ? "bg-sky-600 text-white shadow-lg shadow-sky-900/25"
                  : "text-[var(--erp-sidebar-text)] hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${isActive ? "bg-white/20" : "bg-white/10"}`}>
                {item.icon}
              </span>
              {isOpen && <span className="ml-4 font-bold text-sm tracking-wide">{item.name}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
