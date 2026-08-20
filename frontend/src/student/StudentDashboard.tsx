import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { validateExamCode } from '../api/client'

export default function StudentDashboard() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (code.length !== 6) {
      setError('请输入 6 位考试码')
      return
    }
    setLoading(true)
    try {
      const res = await validateExamCode(code)
      if (res.valid && res.submitted) {
        setError('该考试已参加过，不能重复参加')
      } else if (res.valid) {
        navigate(`/student/exam/confirm?code=${code}`)
      } else if (res.reason === 'finished') {
        setError('该考试已结束')
      } else if (res.reason === 'pending') {
        setError('该考试尚未开始')
      } else {
        setError('考试码无效，请重新输入')
      }
    } catch {
      setError('考试码无效，请重新输入')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center px-4 pt-24">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">请输入考试码参加考试</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6 位考试码"
            maxLength={6}
            className="w-56 mx-auto block text-center text-3xl font-bold tracking-[0.5em] border-2 border-gray-300 rounded-lg py-3 focus:outline-none focus:border-blue-500"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '验证中...' : '进入考试'}
          </button>
        </form>
      </div>
    </div>
  )
}
