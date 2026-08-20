import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

interface Props {
  activeTab: string
  onTabChange: (tab: string) => void
}

const TABS = [
  { key: 'exam-maker', label: '命题工作台' },
  { key: 'exam-publish', label: '考试发布' },
  { key: 'class-mgmt', label: '班级管理' },
  { key: 'dashboard', label: '数据看板' },
]

export default function NavBar({ activeTab, onTabChange }: Props) {
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const roleLabel = user?.role === 'student' ? '学生' : '教师'
  const avatarChar = user?.username?.charAt(0).toUpperCase() || '教'

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAccountMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleTabClick = (key: string) => {
    onTabChange(key)
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        {/* 左侧：Logo + Tab */}
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold text-blue-600 shrink-0">AI 考试系统</span>
          <div className="flex gap-1">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors relative ${
                  activeTab === tab.key
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-blue-600 rounded" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 右侧：账号下拉 */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
          >
            <span className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
              {avatarChar}
            </span>
            <span className="hidden sm:inline">{user?.username || '未登录'}</span>
            <span className="text-xs text-gray-400">{roleLabel}</span>
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 8L2 4h8L6 8z" />
            </svg>
          </button>

          {showAccountMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
              <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                {user?.username} · {roleLabel}
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
              >
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
