import { useState, useEffect, useCallback, useRef } from 'react'
import * as echarts from 'echarts'
import * as XLSX from 'xlsx'
import type { ExamReport as Report } from '../types'
import { getExamReport } from '../api/client'

interface Props {
  examId: string
  onBack: () => void
}

const BUCKET_LABELS = ['0-20', '20-40', '40-60', '60-80', '80-100']

export default function ExamReport({ examId, onBack }: Props) {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const distRef = useRef<HTMLDivElement>(null)
  const qcRef = useRef<HTMLDivElement>(null)

  const loadReport = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getExamReport(examId)
      setReport(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '获取报告失败')
    }
    setLoading(false)
  }, [examId])

  useEffect(() => { loadReport() }, [loadReport])

  useEffect(() => {
    if (!report || !distRef.current) return
    const chart = echarts.init(distRef.current)
    chart.setOption({
      title: { text: '分数段分布', textStyle: { fontSize: 14 } },
      tooltip: {},
      xAxis: { type: 'category', data: BUCKET_LABELS },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{
        type: 'bar',
        data: report.score_distribution,
        itemStyle: { color: '#3b82f6' },
      }],
    })
    return () => chart.dispose()
  }, [report])

  useEffect(() => {
    if (!report || !qcRef.current || report.question_correctness.length === 0) return
    const chart = echarts.init(qcRef.current)
    chart.setOption({
      title: { text: '每题正确率', textStyle: { fontSize: 14 } },
      tooltip: { formatter: (p: { name: string; value: number }) => `${p.name}: ${(p.value * 100).toFixed(0)}%` },
      xAxis: {
        type: 'category',
        data: report.question_correctness.map((_, i) => `第${i + 1}题`),
      },
      yAxis: { type: 'value', max: 1, axisLabel: { formatter: (v: number) => `${(v * 100).toFixed(0)}%` } },
      series: [{
        type: 'bar',
        data: report.question_correctness,
        itemStyle: { color: '#10b981' },
      }],
    })
    return () => chart.dispose()
  }, [report])

  const handleExport = () => {
    if (!report) return
    const rows = [['学生姓名', '得分'], ...report.students.map(s => [s.student_name, s.score])]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '成绩')
    XLSX.writeFile(wb, `${report.exam_name}-成绩.xlsx`)
  }

  if (loading) return <p className="text-gray-400 text-center py-16">加载报告...</p>
  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={onBack} className="text-blue-600 hover:underline">← 返回</button>
      </div>
    )
  }
  if (!report) return null

  const cards = [
    { label: '平均分', value: report.avg_score, color: 'text-blue-600' },
    { label: '及格率', value: `${(report.pass_rate * 100).toFixed(0)}%`, color: 'text-green-600' },
    { label: '最高分', value: report.max_score, color: 'text-orange-600' },
    { label: '最低分', value: report.min_score, color: 'text-red-600' },
  ]

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button onClick={onBack} className="text-sm text-blue-600 hover:underline mb-1">← 返回看板</button>
          <h2 className="text-xl font-bold">{report.exam_name} — 成绩报告</h2>
          <p className="text-xs text-gray-500">考试码 {report.exam_code} · 参加 {report.participant_count} 人</p>
        </div>
        <button
          onClick={handleExport}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
        >
          导出 Excel
        </button>
      </div>

      {/* 指标卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(c => (
          <div key={c.label} className="border rounded-lg p-4 bg-white shadow-sm text-center">
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* 分数段分布 */}
      <div className="border rounded-lg p-4 bg-white shadow-sm mb-6">
        <div ref={distRef} style={{ height: 280 }} />
      </div>

      {/* 每题正确率 */}
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div ref={qcRef} style={{ height: 300 }} />
      </div>
    </div>
  )
}
