import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getExamPaper, submitExam, validateExamCode } from '../api/client'
import type { StudentQuestion } from '../types'

export default function ExamTake() {
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code') || ''
  const navigate = useNavigate()

  const [examName, setExamName] = useState('')
  const [questions, setQuestions] = useState<StudentQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const submittedRef = useRef(false)

  const doSubmit = async () => {
    if (submittedRef.current) return
    submittedRef.current = true
    setSubmitting(true)
    localStorage.removeItem(`exam_answers_${code}`)
    localStorage.removeItem(`exam_timeleft_${code}`)
    const answerList = Object.entries(answers)
      .filter(([, v]) => v && String(v).trim() !== '')
      .map(([question_id, selected_option]) => ({ question_id, selected_option }))
    try {
      const result = await submitExam(code, answerList)
      navigate('/student/exam/complete', { state: result, replace: true })
    } catch {
      submittedRef.current = false
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!code) {
      navigate('/student/dashboard', { replace: true })
      return
    }
    Promise.all([validateExamCode(code), getExamPaper(code)])
      .then(([examRes, paperRes]) => {
        if (!examRes.valid || examRes.submitted || !examRes.exam) {
          navigate('/student/dashboard', { replace: true })
          return
        }
        setExamName(examRes.exam.name)
        setQuestions(paperRes.questions)
        // 恢复答题进度（刷新后不丢失）
        const savedAnswers = localStorage.getItem(`exam_answers_${code}`)
        if (savedAnswers) {
          try {
            setAnswers(JSON.parse(savedAnswers))
          } catch {
            /* 忽略损坏的缓存 */
          }
        }
        const savedTime = localStorage.getItem(`exam_timeleft_${code}`)
        const restored = savedTime ? Number(savedTime) : NaN
        setTimeLeft(Number.isFinite(restored) && restored > 0 ? restored : examRes.exam.duration * 60)
      })
      .catch(() => navigate('/student/dashboard', { replace: true }))
      .finally(() => setLoading(false))
  }, [code, navigate])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem(`exam_answers_${code}`, JSON.stringify(answers))
    }
  }, [answers, questions.length, code])

  useEffect(() => {
    if (questions.length > 0 && timeLeft > 0) {
      localStorage.setItem(`exam_timeleft_${code}`, String(timeLeft))
    }
  }, [timeLeft, questions.length, code])

  useEffect(() => {
    if (timeLeft === 0 && questions.length > 0 && !submittedRef.current) {
      doSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const current = questions[currentIndex]

  const toggleOption = (qid: string, opt: string) => {
    setAnswers(prev => {
      const next = { ...prev }
      if (next[qid] === opt) delete next[qid]
      else next[qid] = opt
      return next
    })
  }

  const setTextAnswer = (qid: string, value: string) => {
    setAnswers(prev => {
      const next = { ...prev }
      if (value === '') delete next[qid]
      else next[qid] = value
      return next
    })
  }

  const handleManualSubmit = () => {
    const unanswered = questions.filter(q => !answers[q.id]?.trim()).length
    if (unanswered > 0) {
      if (!window.confirm(`还有 ${unanswered} 题未作答，确定提交吗？`)) return
    }
    doSubmit()
  }

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-gray-500">加载中...</div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-800">{examName}</h1>
        <div className={`text-sm font-mono font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-gray-700'}`}>
          剩余时间 {formatTime(timeLeft)}
        </div>
      </div>

      {current && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-sm text-gray-500 mb-2">第 {currentIndex + 1} 题（{current.type}）</div>
          <p className="text-gray-800 mb-6 whitespace-pre-wrap">{current.content}</p>
          {current.options.length > 0 ? (
            <div className="space-y-2">
              {current.options.map(opt => (
                <button
                  key={opt}
                  onClick={() => toggleOption(current.id, opt)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    answers[current.id] === opt
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="font-bold mr-2">{opt}</span>
                </button>
              ))}
            </div>
          ) : (
            <textarea
              value={answers[current.id] || ''}
              onChange={e => setTextAnswer(current.id, e.target.value)}
              rows={5}
              placeholder="请输入你的作答..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500"
            />
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 disabled:opacity-40"
        >
          上一题
        </button>
        <span className="text-sm text-gray-500">第 {currentIndex + 1}/{questions.length} 题</span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
            disabled={currentIndex >= questions.length - 1}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
          >
            下一题
          </button>
          <button
            onClick={handleManualSubmit}
            disabled={submitting}
            className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? '提交中...' : '提交答卷'}
          </button>
        </div>
      </div>
    </div>
  )
}
