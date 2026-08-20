import { useState } from 'react'
import type { DifficultyConfig, KnowledgePoint, Paper } from '../types'
import { uploadFiles, analyze, getTaskStatus, generate } from '../api/client'
import Step1Upload from './Step1Upload'
import Step2Knowledge from './Step2Knowledge'
import Step3Papers from './Step3Papers'

export default function ExamMaker() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [course, setCourse] = useState('')
  const [scope, setScope] = useState('')
  const [difficulty, setDifficulty] = useState<DifficultyConfig>({ easy: 60, medium: 30, hard: 10 })
  const [referenceTexts] = useState<string[]>([])
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([])
  const [papers, setPapers] = useState<Paper[]>([])
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')

  const handleStep1 = async (data: {
    course: string
    scope: string
    files: File[]
    difficulty: DifficultyConfig
  }) => {
    setLoading(true)
    setError('')
    setProgress('正在上传文件...')
    setCourse(data.course)
    setScope(data.scope)
    setDifficulty(data.difficulty)
    try {
      const uploaded = await uploadFiles(data.files)
      const fileNames = uploaded.map((f: { filename: string }) => f.filename)
      const { task_id } = await analyze({
        course: data.course,
        scope: data.scope,
        files: fileNames,
        difficulty: data.difficulty,
      })
      let finished = false
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 2000))
        const ts = await getTaskStatus(task_id)
        setProgress(ts.progress || '')
        if (ts.status === 'completed') {
          setKnowledgePoints(ts.result?.knowledge_points || [])
          setStep(2)
          finished = true
          break
        }
        if (ts.status === 'failed') {
          setError(ts.error || '分析失败')
          finished = true
          break
        }
      }
      if (!finished) {
        setError('分析超时，请重试')
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '未知错误'
      setError(msg)
    }
    setLoading(false)
  }

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    setProgress('')
    try {
      const { task_id } = await generate({
        course,
        scope,
        knowledge_points: knowledgePoints,
        difficulty,
        reference_texts: referenceTexts,
      })
      let finished = false
      for (let i = 0; i < 200; i++) {
        await new Promise(r => setTimeout(r, 3000))
        const ts = await getTaskStatus(task_id)
        setProgress(ts.progress || '')
        if (ts.status === 'completed') {
          setPapers(ts.result?.papers || [])
          setStep(3)
          finished = true
          break
        }
        if (ts.status === 'failed') {
          setError(ts.error || '生成失败')
          finished = true
          break
        }
      }
      if (!finished) {
        setError('生成超时，请重试')
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '未知错误'
      setError(msg)
    }
    setLoading(false)
  }

  const steps = ['上传配置', '知识点编辑', '试卷预览']

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-2">AI 命题系统 Demo</h1>
      <p className="text-center text-gray-500 mb-6 text-sm">
        上传往年试卷 → AI 自动提取知识点 → 在线修正 → 生成 4 套模拟卷 → 下载 PDF/Word
      </p>

      {/* 步骤指示器 */}
      <div className="flex justify-center mb-8 gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <div
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                i + 1 === step
                  ? 'bg-blue-100 text-blue-700'
                  : i + 1 < step
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs border border-current">
                {i + 1}
              </span>
              {s}
            </div>
            {i < 2 && <span className="text-gray-300">→</span>}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 flex justify-between items-center">
          <span>❌ {error}</span>
          <button onClick={() => setError('')} className="font-bold text-lg leading-none">&times;</button>
        </div>
      )}

      {loading && (
        <div className="bg-blue-50 text-blue-600 p-3 rounded-lg mb-4 text-center">
          ⏳ {progress || '处理中, AI 正在工作，请耐心等待（最长可能需要几分钟）...'}
        </div>
      )}

      {step === 1 && <Step1Upload onNext={handleStep1} />}
      {step === 2 && (
        <Step2Knowledge
          points={knowledgePoints}
          onUpdate={setKnowledgePoints}
          onGenerate={handleGenerate}
          loading={loading}
        />
      )}
      {step === 3 && <Step3Papers papers={papers} />}

      {step > 1 && (
        <button onClick={() => setStep(s => s - 1)} className="mt-6 text-blue-600 text-sm hover:underline">
          ← 返回上一步
        </button>
      )}
    </div>
  )
}
