import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar'
import ExamMaker from './components/ExamMaker'
import ExamPublish from './components/ExamPublish'
import ClassManagement from './components/ClassManagement'
import Dashboard from './components/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StudentLayout from './student/StudentLayout'
import StudentDashboard from './student/StudentDashboard'
import ExamConfirm from './student/ExamConfirm'
import ExamTake from './student/ExamTake'
import ExamComplete from './student/ExamComplete'
import { useAuth } from './auth/AuthContext'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/teacher/*" element={<ProtectedRoute role="teacher"><TeacherHome /></ProtectedRoute>} />
      <Route path="/student" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="exam/confirm" element={<ExamConfirm />} />
        <Route path="exam/take" element={<ExamTake />} />
        <Route path="exam/complete" element={<ExamComplete />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={user?.role === 'student' ? '/student/dashboard' : '/teacher/dashboard'} replace />
}

function TeacherHome() {
  const [activeTab, setActiveTab] = useState('exam-maker')

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar activeTab={activeTab} onTabChange={setActiveTab} />
      <main>
        {activeTab === 'exam-maker' && <ExamMaker />}
        {activeTab === 'exam-publish' && <ExamPublish />}
        {activeTab === 'class-mgmt' && <ClassManagement />}
        {activeTab === 'dashboard' && <Dashboard />}
      </main>
    </div>
  )
}
