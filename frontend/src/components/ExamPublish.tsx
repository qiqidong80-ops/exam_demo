import { useState, useEffect, useCallback } from 'react'
import type { Exam, ExamCreate, PaperBrief, AntiCheatConfig, ClassInfo } from '../types'
import { getPapers, getExams, createExam, deleteExam, getClasses } from '../api/client'

function getExamStatus(exam: Exam): { label: string; color: string } {
  const now = new Date()
  const start = new Date(exam.exam_time)
  const end = new Date(start.getTime() + exam.duration_minutes * 60000)
  if (now < start) return { label: '未开始', color: 'bg-gray-100 text-gray-600' }
  if (now > end) return { label: '已结束', color: 'bg-red-100 text-red-600' }
  return { label: '进行中', color: 'bg-green-100 text-green-600' }
}

export default function ExamPublish() {
  const [exams, setExams] = useState<Exam[]>([])
  const [papers, setPapers] = useState<PaperBrief[]>([])
  const [classList, setClassList] = useState<ClassInfo[]>([])
  const [error, setError] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // 表单
  const [name, setName] = useState('')
  const [paperId, setPaperId] = useState('')
  const [examTime, setExamTime] = useState('')
  const [duration, setDuration] = useState(120)
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([])
  const [shuffle, setShuffle] = useState(true)
  const [tabSwitch, setTabSwitch] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const loadExams = useCallback(async () => {
    try {
      const data = await getExams()
      setExams(data)
    } catch {
      // 接口暂不可用时静默
    }
  }, [])

  const loadPapers = useCallback(async () => {
    try {
      const data = await getPapers()
      setPapers(data)
    } catch {
      // 接口暂不可用时静默
    }
  }, [])

  const loadClasses = useCallback(async () => {
    try {
      const data = await getClasses()
      setClassList(data)
    } catch {
      // 接口暂不可用时静默
    }
  }, [])

  useEffect(() => {
    loadExams()
    loadPapers()
    loadClasses()
  }, [loadExams, loadPapers, loadClasses])

  const toggleClass = (id: string) => {
    setSelectedClassIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const handleCreate = async () => {
    if (!name.trim()) { setError('请输入考试名称'); return }
    if (!paperId) { setError('请选择试卷'); return }
    if (!examTime) { setError('请设置考试时间'); return }
    if (selectedClassIds.length === 0) { setError('请选择参与班级'); return }

    setError('')
    setSubmitting(true)
    try {
      const antiCheat: AntiCheatConfig = {
        shuffle_questions: shuffle,
        tab_switch_detection: tabSwitch,
      }
      const body: ExamCreate = {
        name: name.trim(),
        paper_id: paperId,
        exam_time: examTime,
        duration_minutes: duration,
        class_ids: selectedClassIds,
        anti_cheat: antiCheat,
      }
      await createExam(body)
      // 重置表单
      setName(''); setPaperId(''); setExamTime(''); setDuration(120)
      setSelectedClassIds([]); setShuffle(true); setTabSwitch(true)
      await loadExams()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '创建失败'
      setError(msg)
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteExam(id)
      await loadExams()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '删除失败'
      setError(msg)
    }
  }

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch {
      // fallback: select text from a visible element
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <h2 className="text-xl font-bold mb-6">考试发布与管理</h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="font-bold text-lg leading-none">&times;</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：考试列表 */}
        <div className="lg:col-span-1">
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            已创建考试 ({exams.length})
          </h3>
          {exams.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center border rounded-lg">
              暂无考试，请在右侧创建
            </p>
          ) : (
            <div className="space-y-3">
              {exams.map(exam => {
                const status = getExamStatus(exam)
                return (
                  <div key={exam.id} className="border rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm truncate flex-1">{exam.name}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>试卷: {exam.paper_title || exam.paper_id}</p>
                      <p>时间: {new Date(exam.exam_time).toLocaleString('zh-CN')}</p>
                      <p>时长: {exam.duration_minutes} 分钟</p>
                      <p className="flex items-center gap-1">
                        考试码:
                        <span className="font-mono font-bold text-blue-600 text-sm">{exam.exam_code}</span>
                        <button
                          onClick={() => handleCopy(exam.exam_code)}
                          className="text-xs text-blue-500 hover:underline ml-1"
                        >
                          {copiedCode === exam.exam_code ? '已复制' : '复制'}
                        </button>
                      </p>
                      <p>班级: {exam.classes.join(', ')}</p>
                      <p className="text-gray-400">
                        防作弊: {exam.anti_cheat?.shuffle_questions ? '乱序' : '无'}
                        {exam.anti_cheat?.tab_switch_detection ? ' + 切屏检测' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="mt-2 text-xs text-red-400 hover:text-red-600"
                    >
                      删除
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 右侧：创建表单 */}
        <div className="lg:col-span-2 border rounded-lg p-6 bg-white shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-4">创建新考试</h3>
          <div className="space-y-4">
            {/* 考试名称 */}
            <div>
              <label className="block text-sm font-medium mb-1">考试名称</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="如: 2026 高等代数期末考试"
              />
            </div>

            {/* 选择试卷 */}
            <div>
              <label className="block text-sm font-medium mb-1">选择试卷</label>
              <select
                value={paperId}
                onChange={e => setPaperId(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm bg-white"
              >
                <option value="">-- 请选择 --</option>
                {papers.map(p => (
                  <option key={p.id} value={p.id}>{p.title} ({p.id})</option>
                ))}
              </select>
              {papers.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">暂无试卷，请先在"命题工作台"生成试卷</p>
              )}
            </div>

            {/* 考试时间 + 时长 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">考试时间</label>
                <input
                  type="datetime-local"
                  value={examTime}
                  onChange={e => setExamTime(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">考试时长（分钟）</label>
                <input
                  type="number"
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  min={1}
                  max={480}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* 参与班级 */}
            <div>
              <label className="block text-sm font-medium mb-1">参与班级（多选）</label>
              {classList.length === 0 ? (
                <p className="text-xs text-gray-400">暂无班级，请先在"班级管理"中创建</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {classList.map(c => (
                    <label
                      key={c.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 border rounded cursor-pointer text-sm transition-colors ${
                        selectedClassIds.includes(c.id)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedClassIds.includes(c.id)}
                        onChange={() => toggleClass(c.id)}
                        className="accent-blue-600"
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 防作弊设置 */}
            <div>
              <label className="block text-sm font-medium mb-2">防作弊设置</label>
              <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm">题目 / 选项乱序</span>
                  <button
                    type="button"
                    onClick={() => setShuffle(!shuffle)}
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      shuffle ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        shuffle ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm">切屏检测与警告</span>
                  <button
                    type="button"
                    onClick={() => setTabSwitch(!tabSwitch)}
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      tabSwitch ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        tabSwitch ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </label>
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? '创建中...' : '创建考试'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
