import { useState, useEffect, useCallback } from 'react'
import type { Exam } from '../types'
import { getFinishedExams } from '../api/client'
import ExamReport from './ExamReport'

export default function Dashboard() {
  const [exams, setExams] = useState<Exam[]>([])
  const [activeExamId, setActiveExamId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadExams = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getFinishedExams()
      setExams(data)
    } catch {
      // 接口不可用时静默
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadExams() }, [loadExams])

  if (activeExamId) {
    return <ExamReport examId={activeExamId} onBack={() => setActiveExamId(null)} />
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <h2 className="text-xl font-bold mb-6">数据看板</h2>

      {loading ? (
        <p className="text-gray-400 text-center py-8">加载中...</p>
      ) : exams.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📊</p>
          <p>暂无已结束的考试</p>
          <p className="text-sm mt-1">考试结束后，成绩会自动归入看板</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4">考试名称</th>
                <th className="text-left py-3 px-4">考试码</th>
                <th className="text-left py-3 px-4">参加人数</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {exams.map(exam => (
                <tr key={exam.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{exam.name}</td>
                  <td className="py-3 px-4 font-mono">{exam.exam_code}</td>
                  <td className="py-3 px-4">{exam.participant_count ?? 0} 人</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setActiveExamId(exam.id)}
                      className="text-blue-600 hover:underline"
                    >
                      查看报告
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
