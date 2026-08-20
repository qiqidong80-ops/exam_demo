import { useState, useRef } from 'react'
import type { DifficultyConfig } from '../types'
import DifficultySlider from './DifficultySlider'

interface UploadData {
  course: string
  scope: string
  files: File[]
  difficulty: DifficultyConfig
}

interface Props {
  onNext: (data: UploadData) => void
}

export default function Step1Upload({ onNext }: Props) {
  const [course, setCourse] = useState('')
  const [scope, setScope] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [difficulty, setDifficulty] = useState<DifficultyConfig>({
    easy: 60,
    medium: 30,
    hard: 10,
  })
  const fileRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)])
  }

  const handleSubmit = () => {
    if (!course.trim()) {
      alert('请输入课程名称')
      return
    }
    if (files.length === 0) {
      alert('请上传试卷文件')
      return
    }
    onNext({ course, scope, files, difficulty })
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">课程名称</label>
        <input
          value={course}
          onChange={e => setCourse(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="如: 高等代数"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">考试范围 (选填)</label>
        <input
          value={scope}
          onChange={e => setScope(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="如: 全书, 重点在特征值"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">上传往年试卷 (PDF/Word)</label>
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-blue-400"
          onClick={() => fileRef.current?.click()}
        >
          <p className="text-gray-500">拖拽文件到此处 或 点击选择</p>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc"
            className="hidden"
            onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
          />
        </div>
        {files.length > 0 && (
          <ul className="mt-2 space-y-1">
            {files.map((f, i) => (
              <li key={i} className="text-sm text-gray-600 flex justify-between">
                <span>📄 {f.name}</span>
                <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">难度比例</label>
        <DifficultySlider value={difficulty} onChange={setDifficulty} />
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        🚀 开始分析
      </button>
    </div>
  )
}
