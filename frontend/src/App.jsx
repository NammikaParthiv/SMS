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
import ForgotPassword from "./pages/ForgotPassword";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
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
  const role = auth?.role?.toLowerCase();
  const can = (...roles) => roles.includes(role);
  const dashboard = <Navigate to="/dashboard" replace />;

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
          element={!auth ? <Login /> : dashboard}
        />
        <Route
          path="/register"
          element={!auth ? <Register /> : dashboard}
        />
        <Route
          path="/forgot-password"
          element={!auth ? <ForgotPassword /> : dashboard}
        />
        <Route
          path="/reset-password/:token"
          element={!auth ? <ResetPassword /> : dashboard}
        />

        <Route element={auth ? <Layout /> : <Navigate to="/" replace />}>
          <Route path="/dashboard" element={<Home />} />
          <Route path="/profile" element={<Profile />} />

          <Route
            path="/assignments"
            element={
              can("admin") ? dashboard : can("teacher") ? (
                <TeacherAssignent />
              ) : (
                <Assignments role="Student" />
              )
            }
          />
          <Route
            path="/assignments/:assignmentId/submissions/:slug?"
            element={
              can("teacher") ? (
                <AssignmentSubmissions />
              ) : (
                dashboard
              )
            }
          />

          <Route
            path="/admin/teachers"
            element={
              can("admin") ? <TeacherDirectory /> : dashboard
            }
          />
          <Route path="/admin/students" element={can("admin") ? <StudentList /> : dashboard} />
          <Route
            path="/admin/allocations"
            element={
              can("admin") ? (
                <TeacherAllocations />
              ) : (
                dashboard
              )
            }
          />
          <Route
            path="/admin/notifications"
            element={
              can("admin") ? (
                <AdminNotifications />
              ) : (
                dashboard
              )
            }
          />

          <Route
            path="/teacher/classes"
            element={
              can("teacher") ? (
                <MyClasses />
              ) : (
                dashboard
              )
            }
          />

          <Route path="/profile/:id" element={<StudentDashboard />} />

          <Route
          path="/marks"
          element={
            can("admin") ? (
              <AdminMarks />
            ) : can("teacher") ? (
              <TeacherMarks />
            ) : (
              <Marks />
            )
          }
        />

          <Route
            path="/notes"
            element={
              can("teacher", "student") ? (
                <Notes />
              ) : (
                dashboard
              )
            }
          />

          <Route
            path="/attendance"
            element={
              can("teacher", "student") ? (
                <Attendance />
              ) : (
                dashboard
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
