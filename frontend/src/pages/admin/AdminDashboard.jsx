import React, { useEffect, useState } from "react";
import {
  approveAdminAccess,
  rejectAdminAccess,
  fetchAdminDashboard,
  fetchPendingAdminApprovals,
  fetchPendingStudentApprovals,
  fetchPendingTeacherApprovals,
} from "../../api/axios";

const AdminDashboard = ({ user }) => {
  const [stats, setStats] = useState({
    teachers: 0,
    students: 0,
    attendance: 0,
    passRate: 0,
  });
  const [pendingTeacherCount, setPendingTeacherCount] = useState(0);
  const [pendingStudentCount, setPendingStudentCount] = useState(0);
  const [pendingAdminCount, setPendingAdminCount] = useState(0);
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approvingId, setApprovingId] = useState("");
  const [rejectingId, setRejectingId] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const [dashboardRes, pendingTeacherRes, pendingStudentRes, pendingAdminRes] = await Promise.all([
          fetchAdminDashboard(),
          fetchPendingTeacherApprovals(),
          fetchPendingStudentApprovals(),
          fetchPendingAdminApprovals(),
        ]);

        setStats({
          teachers: dashboardRes.data?.users?.totalTeachers || 0,
          students: dashboardRes.data?.users?.totalStudents || 0,
          attendance: dashboardRes.data?.attendance?.attendancePercentage || 0,
          passRate: dashboardRes.data?.results?.passPercentage || 0,
        });
        setPendingTeacherCount(pendingTeacherRes.data?.count || pendingTeacherRes.data?.items?.length || 0);
        setPendingStudentCount(pendingStudentRes.data?.count || pendingStudentRes.data?.items?.length || 0);
        setPendingAdminCount(pendingAdminRes.data?.count || pendingAdminRes.data?.items?.length || 0);
        setPendingAdmins(pendingAdminRes.data?.items || []);
      } catch (err) {
        setError(err.response?.data?.msg || "Failed to load admin profile");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white p-10 rounded-4xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Admin Profile</p>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{user?.name}</h1>
            <p className="text-slate-500 font-medium mt-2">System overview and approvals hub</p>
          </div>
          <div className="bg-slate-900 text-white px-6 py-4 rounded-3xl">
            <p className="text-[10px] uppercase tracking-widest text-slate-300 font-black">Pending Approvals</p>
            <div className="mt-2 flex gap-6">
              <div>
                <p className="text-xs text-slate-300">Teachers</p>
                <p className="text-2xl font-black">{pendingTeacherCount}</p>
              </div>
              <div>
                <p className="text-xs text-slate-300">Students</p>
                <p className="text-2xl font-black">{pendingStudentCount}</p>
              </div>
              <div>
                <p className="text-xs text-slate-300">Admins</p>
                <p className="text-2xl font-black">{pendingAdminCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-2xl text-sm font-bold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Teachers</p>
          <h3 className="text-3xl font-black text-slate-900 mt-3">{loading ? "..." : stats.teachers}</h3>
        </div>
        <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Students</p>
          <h3 className="text-3xl font-black text-slate-900 mt-3">{loading ? "..." : stats.students}</h3>
        </div>
        <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attendance %</p>
          <h3 className="text-3xl font-black text-emerald-600 mt-3">{loading ? "..." : `${stats.attendance}%`}</h3>
        </div>
        <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pass %</p>
          <h3 className="text-3xl font-black text-indigo-600 mt-3">{loading ? "..." : `${stats.passRate}%`}</h3>
        </div>
      </div>

      <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Admin Approvals</p>
            <p className="text-slate-500 font-medium">Approve new admin registrations.</p>
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-slate-500">
            {pendingAdminCount} pending
          </span>
        </div>

        {pendingAdmins.length === 0 ? (
          <div className="text-slate-500 font-semibold">No pending admin approval requests.</div>
        ) : (
          <div className="space-y-3">
            {pendingAdmins.map((admin) => (
              <div
                key={admin.id}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <p className="font-black text-slate-900">{admin.name}</p>
                  <p className="text-xs text-slate-500 font-medium">{admin.email}</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setApprovingId(admin.id);
                    setError("");
                    try {
                      await approveAdminAccess(admin.id);
                      setPendingAdmins((prev) => prev.filter((p) => p.id !== admin.id));
                      setPendingAdminCount((prev) => Math.max(prev - 1, 0));
                    } catch (err) {
                      setError(err.response?.data?.msg || "Failed to approve admin");
                    } finally {
                      setApprovingId("");
                    }
                  }}
                  disabled={approvingId === admin.id}
                  className="px-4 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-60"
                >
                  {approvingId === admin.id ? "Approving..." : "Approve"}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = window.confirm(`Reject admin request for ${admin.name}?`);
                    if (!confirmed) return;
                    setRejectingId(admin.id);
                    setError("");
                    try {
                      await rejectAdminAccess(admin.id);
                      setPendingAdmins((prev) => prev.filter((p) => p.id !== admin.id));
                      setPendingAdminCount((prev) => Math.max(prev - 1, 0));
                    } catch (err) {
                      setError(err.response?.data?.msg || "Failed to reject admin");
                    } finally {
                      setRejectingId("");
                    }
                  }}
                  disabled={rejectingId === admin.id}
                  className="px-4 py-3 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 disabled:opacity-60"
                >
                  {rejectingId === admin.id ? "Rejecting..." : "Reject"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminDashboard;
