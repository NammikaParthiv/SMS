import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuth } from "../../hooks/useAuth";

const Layout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("erp-theme") || "dark");
  const { auth, logout } = useAuth();
  const location = useLocation();

  const isAdminObserverProfileRoute =
    auth?.role?.toLowerCase() === "admin" && /^\/profile\/[^/]+$/.test(location.pathname);

  const handleLogoutClick = () => {
    const confirmed = window.confirm("Confirm: do you want to logout?");
    if (confirmed) {
      logout();
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-light");
    root.classList.add(`theme-${theme}`);
    localStorage.setItem("erp-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className="flex min-h-screen bg-[var(--erp-app-bg)] overflow-hidden">
      <div
        className={`${isSidebarOpen ? "w-72" : "w-24"} transition-all duration-300 bg-[var(--erp-sidebar-bg)] border-r border-[var(--erp-sidebar-border)] h-screen sticky top-0 flex-shrink-0`}
      >
        <Sidebar isOpen={isSidebarOpen} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header
          className="h-20 border-b px-8 sticky top-0 z-10 flex items-center relative flex-shrink-0 shadow-[0_10px_30px_rgba(3,7,18,0.24)]"
          style={{
            background: `linear-gradient(90deg, var(--erp-nav-from) 0%, var(--erp-nav-to) 100%)`,
            borderColor: "var(--erp-nav-border)",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors border border-white/5"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m14.95 6.95-1.414-1.414M6.464 7.05 5.05 5.636m0 12.728 1.414-1.414M17.536 7.05l1.414-1.414" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
                </svg>
              )}
            </button>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h2 className="font-black text-white tracking-tight text-2xl md:text-3xl text-center">
              School Management System
            </h2>
          </div>

          <div className="flex items-center gap-4 justify-end flex-1">
            <div className="text-right hidden md:block">
              <p className="text-2xl font-extrabold text-white tracking-tight leading-none">
                {auth?.name || "User"}
              </p>
            </div>
            <div className="relative" tabIndex={0}>
              <button
                type="button"
                onClick={() => setShowLogoutMenu((prev) => !prev)}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Open logout menu"
              >
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 17l5-5-5-5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H3" />
                </svg>
              </button>

              {showLogoutMenu && (
                <div className="absolute right-0 mt-3 w-40 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLogoutMenu(false);
                      handleLogoutClick();
                    }}
                    className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={`p-6 md:p-10 flex-1 ${isAdminObserverProfileRoute ? "observer-mode-main" : "erp-content-main"}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

