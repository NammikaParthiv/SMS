import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

import Layout from "./components/layout/Layout";
import StudentList from "./pages/admin/StudentList";
import TeacherAllocations from "./pages/admin/TeacherAllocations";
import TeacherDirectory from "./pages/admin/TeacherDirectory";
import AdminMarks from "./pages/admin/AdminMarks";
import AdminNotifications from "./pages/admin/AdminNotifications";
import Assignments from "./pages/Assignments";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Welcome from "./pages/Welcome";
import Attendance from "./pages/Attendance";
import MyClasses from "./pages/teacher/MyClasses";
import TeacherAssignent from "./pages/teacher/TeacherAssignent";
import TeacherMarks from "./pages/teacher/TeacherMarks";
import AssignmentSubmissions from "./pages/teacher/AssignmentSubmissions";
import StudentDashboard from "./pages/student/StudentDashboard";
import Notes from "./pages/Notes";
import Marks from "./pages/Marks";

function App() {
  const { auth, loading } = useAuth();

  if (loading) {
    return <div className="h-screen flex items-center justify-center font-black">LOADING...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/welcome" element={<Welcome />} />

        <Route
          path="/login"
          element={!auth ? <Login /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/register"
          element={!auth ? <Register /> : <Navigate to="/dashboard" replace />}
        />

        <Route element={auth ? <Layout /> : <Navigate to="/" replace />}>
          <Route path="/dashboard" element={<Home />} />
          <Route path="/profile" element={<Profile />} />

          <Route
            path="/assignments"
            element={
              auth?.role?.toLowerCase() === "admin" ? (
                <Navigate to="/dashboard" replace />
              ) : auth?.role?.toLowerCase() === "teacher" ? (
                <TeacherAssignent />
              ) : (
                <Assignments role="Student" />
              )
            }
          />
          <Route
            path="/assignments/:assignmentId/submissions/:slug?"
            element={
              auth?.role?.toLowerCase() === "teacher" ? (
                <AssignmentSubmissions />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/admin/teachers"
            element={
              auth?.role?.toLowerCase() === "admin" ? <TeacherDirectory /> : <Navigate to="/dashboard" replace />
            }
          />
          <Route path="/admin/students" element={auth?.role?.toLowerCase() === "admin" ? <StudentList /> : <Navigate to="/dashboard" replace />} />
          <Route
            path="/admin/allocations"
            element={
              auth?.role?.toLowerCase() === "admin" ? (
                <TeacherAllocations />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/admin/notifications"
            element={
              auth?.role?.toLowerCase() === "admin" ? (
                <AdminNotifications />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/teacher/classes"
            element={
              auth?.role?.toLowerCase() === "teacher" ? (
                <MyClasses />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route path="/profile/:id" element={<StudentDashboard />} />

          <Route
          path="/marks"
          element={
            auth?.role?.toLowerCase() === "admin" ? (
              <AdminMarks />
            ) : auth?.role?.toLowerCase() === "teacher" ? (
              <TeacherMarks />
            ) : (
              <Marks />
            )
          }
        />

          <Route
            path="/notes"
            element={
              auth?.role?.toLowerCase() === "teacher" || auth?.role?.toLowerCase() === "student" ? (
                <Notes />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/attendance"
            element={
              auth?.role?.toLowerCase() === "teacher" || auth?.role?.toLowerCase() === "student" ? (
                <Attendance />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
        </Route>

        <Route path="*" element={<Navigate to={auth ? "/dashboard" : "/"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
