import React, { useEffect, useState, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuth } from "../../hooks/useAuth";

const Layout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(() => {
    return typeof window !== "undefined" ? window.innerWidth >= 768 : true;
  });
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("erp-theme") || "light");
  const { auth, logout } = useAuth();
  const location = useLocation();
  const menuRef = useRef(null);

  const isAdminObserverProfileRoute =
    auth?.role?.toLowerCase() === "admin" && /^\/profile\/[^/]+$/.test(location.pathname);

  const handleLogoutClick = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      logout();
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-light", "dark");
    if (theme === "dark") {
      root.classList.add("theme-dark", "dark");
    } else {
      root.classList.add("theme-light");
    }
    localStorage.setItem("erp-theme", theme);
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowLogoutMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div
      className={`flex h-screen w-full font-sans overflow-hidden transition-colors duration-200 ${
        theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-800"
      }`}
    >
      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <div
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } fixed md:static top-0 left-0 z-50 h-full shrink-0 transition-transform duration-200 ease-in-out`}
      >
        <Sidebar
          isOpen={isSidebarOpen}
          onNavigate={() => {
            if (window.innerWidth < 768) {
              setSidebarOpen(false);
            }
          }}
        />
      </div>

      <div
        className={`flex-1 flex flex-col min-w-0 h-full overflow-hidden ${
          theme === "dark" ? "bg-slate-950" : "bg-slate-100"
        }`}
      >
        <header
          className={`h-16 sm:h-19 px-3 sm:px-6 flex items-center justify-between border-b shrink-0 transition-colors duration-200 ${
            theme === "dark"
              ? "bg-slate-900 border-slate-800 text-white"
              : "bg-white border-slate-300 text-slate-900"
          }`}
        >
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-lg border text-sm transition-all duration-150 active:scale-95 cursor-pointer ${
                theme === "dark"
                  ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                  : "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-200"
              }`}
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-lg border text-sm transition-all duration-150 active:scale-95 cursor-pointer ${
                theme === "dark"
                  ? "border-slate-700 bg-slate-800 text-yellow-400 hover:bg-slate-700"
                  : "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-200"
              }`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m14.95 6.95-1.414-1.414M6.464 7.05 5.05 5.636m0 12.728 1.414-1.414M17.536 7.05l1.414-1.414" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
                </svg>
              )}
            </button>
          </div>

          <div className="flex items-center px-1">
            <h1 className="text-sm sm:text-lg md:text-xl font-bold tracking-tight truncate max-w-35 xs:max-w-[190px] sm:max-w-none">
              🛕 Pyramid School
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 relative" ref={menuRef}>
            <span className="hidden sm:inline-block text-lg sm:text-xl font-bold tracking-tight">
              {auth?.name || "User"}
            </span>

            <button
              type="button"
              onClick={() => setShowLogoutMenu((prev) => !prev)}
              className={`w-9 h-9 rounded-lg border flex items-center justify-center font-bold text-sm transition-all duration-150 active:scale-95 cursor-pointer ${
                theme === "dark"
                  ? "bg-slate-800 text-teal-300 border-slate-700 hover:bg-slate-700"
                  : "bg-slate-800 text-white border-slate-900 hover:bg-slate-700"
              }`}
              aria-label="User menu"
            >
              {auth?.name ? auth.name.charAt(0).toUpperCase() : "U"}
            </button>

            {showLogoutMenu && (
              <div
                className={`absolute right-0 top-12 w-44 rounded-xl shadow-lg border overflow-hidden z-50 ${
                  theme === "dark"
                    ? "bg-slate-900 border-slate-700 text-slate-200"
                    : "bg-white border-slate-300 text-slate-800"
                }`}
              >
                <div className="p-1">
                  <div className="sm:hidden px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-bold truncate text-slate-900 dark:text-slate-100">
                      {auth?.name || "User"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLogoutMenu(false);
                      handleLogoutClick();
                    }}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      theme === "dark"
                        ? "text-red-400 hover:bg-red-950/40"
                        : "text-red-600 hover:bg-red-50"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main
          className={`flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 ${
            isAdminObserverProfileRoute ? "observer-mode-main" : "erp-content-main"
          }`}
        >
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;