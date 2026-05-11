import React from 'react';
import { useAuth } from '../hooks/useAuth';
import StudentDashboard from './student/StudentDashboard';
import TeacherDashboard from './teacher/TeacherDashboard';
import AdminDashboard from './admin/AdminDashboard';

const Profile = () => {
  const { auth } = useAuth();
  
  // Normalize the role string
  const role = auth?.role?.toLowerCase().trim();

  // Return the correct dashboard based on role
  if (role === 'admin') return <AdminDashboard user={auth} />;
  if (role === 'teacher') return <TeacherDashboard user={auth} />;
  
  // Default to student
  return <StudentDashboard user={auth} />;
};

export default Profile;