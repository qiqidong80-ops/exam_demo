import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { validateExamCode } from '../api/client'
import type { ExamValidateResponse } from '../types'

export default function ExamConfirm() {
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code') || ''
  const navigate = useNavigate()
  const [exam, setExam] = useState<ExamValidateResponse['exam'] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!code) {
      navigate('/student/dashboard', { replace: true })
      return
    }
    validateExamCode(code)
      .then(res => {
        if (res.valid && !res.submitted && res.exam) setExam(res.exam)
        else navigate('/student/dashboard', { replace: true })
      })
      .catch(() => navigate('/student/dashboard', { replace: true }))
      .finally(() => setLoading(false))
  }, [code, navigate])

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-gray-500">加载中...</div>
  }
  if (!exam) return null

  return (
    <div className="flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-8">
        <h1 className="text-xl font-bold text-gray-800 mb-6">考试信息确认</h1>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex justify-between"><span className="text-gray-500">考试名称</span><span>{exam.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">考试时长</span><span>{exam.duration} 分钟</span></div>
          <div className="flex justify-between"><span className="text-gray-500">题目数量</span><span>{exam.question_count} 题</span></div>
        </div>
        <button
          onClick={() => navigate(`/student/exam/take?code=${code}`)}
          className="mt-8 w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700"
        >
          开始答题
        </button>
      </div>
    </div>
  )
}
