import { useLocation, useNavigate } from 'react-router-dom'
import type { SubmitResult } from '../types'

export default function ExamComplete() {
  const location = useLocation()
  const navigate = useNavigate()
  const result = location.state as SubmitResult | null

  return (
    <div className="flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">提交成功</h1>
        <p className="text-gray-500 mb-6">感谢您的作答！</p>
        {result && (
          <div className="mb-6">
            <div className="text-5xl font-bold text-blue-600">{result.score}</div>
            <div className="text-sm text-gray-500 mt-2">
              满分 {result.total} 分 · 答对 {result.correct_count}/{result.total_count} 题
            </div>
          </div>
        )}
        <button
          onClick={() => navigate('/student/dashboard', { replace: true })}
          className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700"
        >
          返回首页
        </button>
      </div>
    </div>
  )
}
