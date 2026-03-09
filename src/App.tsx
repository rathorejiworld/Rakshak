import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

// Pages
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import About from '@/pages/About'
import StudentDashboard from '@/pages/dashboard/StudentDashboard'
import TeacherDashboard from '@/pages/dashboard/TeacherDashboard'
import RootDashboard from '@/pages/dashboard/RootDashboard'
import Settings from '@/pages/Settings'
import Chat from '@/pages/Chat'
import NewReport from '@/pages/NewReport'
import MyReports from '@/pages/dashboard/MyReports'
import ReportDetail from '@/pages/ReportDetail'
import HelpSupport from '@/pages/HelpSupport'

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/about" element={<About />} />

        {/* Protected Routes - Student */}
        <Route
          path="/dashboard/student"
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/student/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/student/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/student/report/new"
          element={
            <ProtectedRoute>
              <NewReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/student/myReport"
          element={
            <ProtectedRoute>
              <MyReports />
            </ProtectedRoute>
          }
        />
        {/* Removed duplicate route for /dashboard/student/chat to avoid conflicts */}

        {/* Protected Routes - Teacher */}
        <Route
          path="/dashboard/teacher"
          element={
            <ProtectedRoute>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/teacher/report/new"
          element={
            <ProtectedRoute>
              <NewReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/teacher/myReport"
          element={
            <ProtectedRoute>
              <MyReports />
            </ProtectedRoute>
          }
        />
        {/* Removed duplicate route for /dashboard/teacher/chat to avoid conflicts */}

        {/* Protected Routes - Root */}
        <Route
          path="/dashboard/root"
          element={
            <ProtectedRoute>
              <RootDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/root/report/new"
          element={
            <ProtectedRoute>
              <NewReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/root/myReport"
          element={
            <ProtectedRoute>
              <MyReports />
            </ProtectedRoute>
          }
        />
        {/* Removed duplicate route for /dashboard/root/chat to avoid conflicts */}

        {/* Help & Support (accessible from all roles) */}
        <Route
          path="/dashboard/:role/help"
          element={
            <ProtectedRoute>
              <HelpSupport />
            </ProtectedRoute>
          }
        />

        {/* Report detail (accessible from all roles) */}
        <Route path="/report/:id" element={<ProtectedRoute><ReportDetail /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
