import axios from "axios";

const instance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || "";
    const isAuthRequest =
      requestUrl.includes("/auth/login") || requestUrl.includes("/auth/register");

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// --- ADMIN API CALLS ---
export const fetchAllStudents = (params) => instance.get("/students", { params });
export const fetchAllTeachers = () => instance.get("/teachers");
export const getStudentProfile = (id) => instance.get(`/students/${id}`);
export const uploadStudentProfilePhoto = (id, formData) =>
  instance.patch(`/students/${id}/photo`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteStudentProfilePhoto = (id) => {
  const formData = new FormData();
  formData.append("delete", "true");
  return instance.patch(`/students/${id}/photo`, formData);
};
export const searchStudentsByName = (name) =>
  instance.get("/admin/students/search", { params: { name } });
export const fetchAdminAssignments = (params) => instance.get("/admin/assignments", { params });
export const fetchTeacherAllocations = (params) => instance.get("/admin/allocations", { params });
export const createTeacherAllocation = (payload) => instance.post("/admin/allocations", payload);
export const deleteTeacherAllocation = (id) => instance.delete(`/admin/allocations/${id}`);
export const fetchPendingTeacherApprovals = () => instance.get("/admin/teachers/pending");
export const approveTeacherAccess = (teacherId) =>
  instance.patch(`/admin/teachers/${teacherId}/approve`);
export const deleteTeacherAccount = (teacherId) =>
  instance.delete(`/admin/teachers/${teacherId}`);
export const deleteStudentAccount = (studentId) =>
  instance.delete(`/admin/students/${studentId}`);
export const deleteClassData = (classAssigned) =>
  instance.delete(`/admin/classes/${classAssigned}`);
export const fetchPendingStudentApprovals = () => instance.get("/admin/students/pending");
export const approveStudentAccess = (studentId) =>
  instance.patch(`/admin/students/${studentId}/approve`);
export const fetchPendingAdminApprovals = () => instance.get("/admin/admins/pending");
export const approveAdminAccess = (adminId) =>
  instance.patch(`/admin/admins/${adminId}/approve`);
export const rejectAdminAccess = (adminId) =>
  instance.delete(`/admin/admins/${adminId}`);
export const fetchClassAverageMarks = () => instance.get("/admin/marks/averages");
export const fetchAdminDashboard = () => instance.get("/admin/dashboard");
export const sendAdminBroadcast = (payload) => instance.post("/admin/notifications/broadcast", payload);

// --- NOTES API CALLS ---
export const uploadNote = (formData) =>
  instance.post("/notes/teacher", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const fetchTeacherNotes = (classAssigned) =>
  instance.get(`/notes/teacher/${classAssigned}`);
export const fetchStudentNotes = () => instance.get("/notes/student/me");

// --- TEACHER API CALLS ---
export const updateMarks = (marksData) => instance.post("/marks", marksData);
export const createAssignment = (formData) =>
  instance.post("/teacher/assignments", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const listTeacherAssignments = (params) =>
  instance.get("/teacher/assignments", { params });
export const fetchAssignmentSubmissions = (assignmentId) =>
  instance.get(`/teacher/assignments/${assignmentId}/submissions`);
export const extendTeacherAssignmentDueDate = (assignmentId, dueDate) =>
  instance.patch(`/teacher/assignments/${assignmentId}/due-date`, { dueDate });
export const fetchAllowedClasses = () => instance.get("/classes");
export const fetchMyTeachingClasses = () => instance.get("/teacher/my-classes");
export const fetchMyClassStudents = (classAssigned) =>
  instance.get(`/teacher/my-classes/${classAssigned}/students`);

// --- ATTENDANCE API CALLS ---
export const fetchClassAttendanceForDate = (classAssigned, date) =>
  instance.get(`/attendance/class/${classAssigned}`, { params: { date } });
export const saveClassAttendance = (payload) => instance.post("/attendance", payload);
export const fetchMyAcademicAttendance = (academicStartYear) =>
  instance.get("/attendance/student/me", { params: { academicStartYear } });

// --- STUDENT API CALLS ---
export const getMyStats = () => instance.get("/student/dashboard");
export const downloadReportCard = (studentId) =>
  instance.get(`/student/report-card/${studentId}`, { responseType: "blob" });
export const fetchMyNotifications = (params) =>
  instance.get("/notifications/mine", { params });
export const markNotificationRead = (id) =>
  instance.patch(`/notifications/${id}/read`);
export const deleteNotification = (id) =>
  instance.delete(`/notifications/${id}`);
export const fetchStudentAssignments = () => instance.get("/assignments/student");
export const submitAssignmentFile = (assignmentId, formData) =>
  instance.post(`/submissions/${assignmentId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const fetchMyMarksSummary = () => instance.get("/marks/student/me");

export default instance;
