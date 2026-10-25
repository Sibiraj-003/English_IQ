import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ClassSectionsManager } from './pages/admin/ClassSectionsManager';
import { SubjectManager } from './pages/admin/SubjectManager';
import { TeacherAllocationManager } from './pages/admin/TeacherAllocationManager';
import { BulkCsvOnboarding } from './pages/admin/BulkCsvOnboarding';
import { TimetableManager } from './pages/admin/TimetableManager';
import { FeeManagement } from './pages/admin/FeeManagement';
import { AuditLogs } from './pages/admin/AuditLogs';

// Teacher Pages
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherClassroom } from './pages/teacher/TeacherClassroom';
import { ClassManagement } from './pages/teacher/ClassManagement';
import { ClassDetail } from './pages/teacher/ClassDetail';
import { BookLibrary } from './pages/teacher/BookLibrary';
import { BookUpload } from './pages/teacher/BookUpload';
import { BookInspection } from './pages/teacher/BookInspection';
import { TeacherLessons } from './pages/teacher/TeacherLessons';
import { QuestionBank } from './pages/teacher/QuestionBank';
import { TestBuilder } from './pages/teacher/TestBuilder';
import { TeacherAnalytics } from './pages/teacher/TeacherAnalytics';
import { TeacherAttendance } from './pages/teacher/TeacherAttendance';
import { TeacherHomework } from './pages/teacher/TeacherHomework';
import { TeacherMarks } from './pages/teacher/TeacherMarks';
import { TeacherMessages } from './pages/teacher/TeacherMessages';
import { TeacherAiAssistant } from './pages/teacher/TeacherAiAssistant';

// Parent Pages
import { ParentDashboard } from './pages/parent/ParentDashboard';
import { ParentAttendance } from './pages/parent/ParentAttendance';
import { ParentHomework } from './pages/parent/ParentHomework';
import { ParentMarks } from './pages/parent/ParentMarks';
import { ParentFees } from './pages/parent/ParentFees';
import { ParentTimetable } from './pages/parent/ParentTimetable';
import { ParentMessages } from './pages/parent/ParentMessages';
import { ParentNotifications } from './pages/parent/ParentNotifications';

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
import { StudentProfile } from './pages/student/StudentProfile';

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
            <Navigate
              to={
                role === 'teacher'
                  ? '/teacher/dashboard'
                  : role === 'parent'
                  ? '/parent/dashboard'
                  : '/student/dashboard'
              }
              replace
            />
          ) : (
            <DashboardLayout />
          )
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminDashboard />} />
        <Route path="sections" element={<ClassSectionsManager />} />
        <Route path="subjects" element={<SubjectManager />} />
        <Route path="assignments" element={<TeacherAllocationManager />} />
        <Route path="csv-import" element={<BulkCsvOnboarding />} />
        <Route path="timetable" element={<TimetableManager />} />
        <Route path="fees" element={<FeeManagement />} />
        <Route path="audit-logs" element={<AuditLogs />} />
      </Route>

      {/* Teacher Portal Protected Routes - Teacher and Administrator Access */}
      <Route
        path="/teacher"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : role === 'student' ? (
            <Navigate to="/student/dashboard" replace />
          ) : role === 'parent' ? (
            <Navigate to="/parent/dashboard" replace />
          ) : (
            <DashboardLayout />
          )
        }
      >
        <Route index element={<Navigate to="/teacher/dashboard" replace />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="ai-assistant" element={<TeacherAiAssistant />} />
        <Route path="classroom" element={<TeacherClassroom />} />
        <Route path="classroom/:classId" element={<TeacherClassroom />} />
        <Route path="navigation" element={<TeacherClassroom />} />
        <Route path="navigation/:classId" element={<TeacherClassroom />} />
        <Route path="attendance" element={<TeacherAttendance />} />
        <Route path="homework" element={<TeacherHomework />} />
        <Route path="marks" element={<TeacherMarks />} />
        <Route path="timetable" element={<TimetableManager />} />
        <Route path="messages" element={<TeacherMessages />} />
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

      {/* Parent Portal Protected Routes - Parent and Admin Access */}
      <Route
        path="/parent"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : role !== 'parent' && role !== 'admin' ? (
            <Navigate
              to={role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'}
              replace
            />
          ) : (
            <DashboardLayout />
          )
        }
      >
        <Route index element={<Navigate to="/parent/dashboard" replace />} />
        <Route path="dashboard" element={<ParentDashboard />} />
        <Route path="attendance" element={<ParentAttendance />} />
        <Route path="homework" element={<ParentHomework />} />
        <Route path="marks" element={<ParentMarks />} />
        <Route path="fees" element={<ParentFees />} />
        <Route path="timetable" element={<ParentTimetable />} />
        <Route path="messages" element={<ParentMessages />} />
        <Route path="notifications" element={<ParentNotifications />} />
      </Route>

      {/* Student Portal Protected Routes */}
      <Route
        path="/student"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : role !== 'student' && role !== 'admin' ? (
            <Navigate
              to={role === 'parent' ? '/parent/dashboard' : '/teacher/dashboard'}
              replace
            />
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
        <Route path="profile" element={<StudentProfile />} />
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
            ) : role === 'parent' ? (
              <Navigate to="/parent/dashboard" replace />
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
