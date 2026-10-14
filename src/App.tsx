import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';

// Teacher Pages
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { ClassManagement } from './pages/teacher/ClassManagement';
import { ClassDetail } from './pages/teacher/ClassDetail';
import { BookLibrary } from './pages/teacher/BookLibrary';
import { BookUpload } from './pages/teacher/BookUpload';
import { BookInspection } from './pages/teacher/BookInspection';
import { TeacherLessons } from './pages/teacher/TeacherLessons';
import { QuestionBank } from './pages/teacher/QuestionBank';
import { TestBuilder } from './pages/teacher/TestBuilder';
import { TeacherAnalytics } from './pages/teacher/TeacherAnalytics';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentLessons } from './pages/student/StudentLessons';
import { StudentLessonView } from './pages/student/StudentLessonView';
import { AiTeacher } from './pages/student/AiTeacher';
import { StudentPractice } from './pages/student/StudentPractice';
import { StudentTestCenter } from './pages/student/StudentTestCenter';
import { StudentTestRunner } from './pages/student/StudentTestRunner';
import { StudentTestResult } from './pages/student/StudentTestResult';
import { StudentProgress } from './pages/student/StudentProgress';
import { StudentAchievements } from './pages/student/StudentAchievements';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';

export const App: React.FC = () => {
  const { user, role } = useAuth();

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Admin Portal Protected Routes - Strict Admin Only */}
      <Route
        path="/admin"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : role !== 'admin' ? (
            <Navigate to={role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} replace />
          ) : (
            <DashboardLayout />
          )
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminDashboard />} />
      </Route>

      {/* Teacher Portal Protected Routes - Teacher and Administrator Access */}
      <Route
        path="/teacher"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : role === 'student' ? (
            <Navigate to="/student/dashboard" replace />
          ) : (
            <DashboardLayout />
          )
        }
      >
        <Route index element={<Navigate to="/teacher/dashboard" replace />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="classes" element={<ClassManagement />} />
        <Route path="classes/:id" element={<ClassDetail />} />
        <Route path="books" element={<BookLibrary />} />
        <Route path="books/upload" element={<BookUpload />} />
        <Route path="books/:id" element={<BookInspection />} />
        <Route path="lessons" element={<TeacherLessons />} />
        <Route path="lessons/:id" element={<StudentLessonView />} />
        <Route path="questions" element={<QuestionBank />} />
        <Route path="tests" element={<TestBuilder />} />
        <Route path="tests/create" element={<TestBuilder />} />
        <Route path="analytics" element={<TeacherAnalytics />} />
      </Route>

      {/* Student Portal Protected Routes */}
      <Route
        path="/student"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : (role !== 'student' && role !== 'admin') ? (
            <Navigate to="/teacher/dashboard" replace />
          ) : (
            <DashboardLayout />
          )
        }
      >
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="lessons" element={<StudentLessons />} />
        <Route path="lessons/:id" element={<StudentLessonView />} />
        <Route path="ai-teacher" element={<AiTeacher />} />
        <Route path="practice" element={<StudentPractice />} />
        <Route path="tests" element={<StudentTestCenter />} />
        <Route path="tests/:id" element={<StudentTestRunner />} />
        <Route path="results/:id" element={<StudentTestResult />} />
        <Route path="progress" element={<StudentProgress />} />
        <Route path="achievements" element={<StudentAchievements />} />
      </Route>

      {/* Root redirect */}
      <Route
        path="/"
        element={
          user ? (
            role === 'admin' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : role === 'teacher' ? (
              <Navigate to="/teacher/dashboard" replace />
            ) : (
              <Navigate to="/student/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
export default App;
