import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function StudentLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-800">
          ← 退出登录
        </button>
        <span className="text-sm text-gray-400">{user?.username}</span>
      </header>
      <Outlet />
    </div>
  )
}
