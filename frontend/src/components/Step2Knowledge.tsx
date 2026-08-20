import { useState } from 'react'
import type { KnowledgePoint } from '../types'

interface Props {
  points: KnowledgePoint[]
  onUpdate: (points: KnowledgePoint[]) => void
  onGenerate: () => void
  loading: boolean
}

export default function Step2Knowledge({ points, onUpdate, onGenerate, loading }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const addPoint = () => {
    const newPoint: KnowledgePoint = {
      id: `kp-new-${Date.now()}`,
      name: '新知识点',
      difficulty: 'medium',
      parent_topic: '',
      question_refs: [],
    }
    onUpdate([...points, newPoint])
  }

  const deletePoint = (id: string) => {
    onUpdate(points.filter(p => p.id !== id))
  }

  const updatePoint = (id: string, field: keyof KnowledgePoint, value: string) => {
    onUpdate(points.map(p => (p.id === id ? { ...p, [field]: value } : p)))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">知识点列表 ({points.length})</h3>
        <button onClick={addPoint} className="text-blue-600 text-sm hover:underline">
          + 添加考点
        </button>
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left py-2 px-1">名称</th>
            <th className="text-left py-2 px-1">难度</th>
            <th className="text-left py-2 px-1">章节</th>
            <th className="py-2 px-1 w-16">操作</th>
          </tr>
        </thead>
        <tbody>
          {points.map(p => (
            <tr key={p.id} className="border-b hover:bg-gray-50">
              <td className="py-2 px-1">
                {editingId === p.id ? (
                  <input
                    value={p.name}
                    onChange={e => updatePoint(p.id, 'name', e.target.value)}
                    onBlur={() => setEditingId(null)}
                    className="border rounded px-1 w-full"
                    autoFocus
                  />
                ) : (
                  <span onClick={() => setEditingId(p.id)} className="cursor-pointer hover:text-blue-600">
                    {p.name}
                  </span>
                )}
              </td>
              <td className="py-2 px-1">
                <select
                  value={p.difficulty}
                  onChange={e => updatePoint(p.id, 'difficulty', e.target.value)}
                  className="border rounded px-1 text-xs"
                >
                  <option value="easy">基础</option>
                  <option value="medium">中等</option>
                  <option value="hard">难题</option>
                </select>
              </td>
              <td className="py-2 px-1">
                <input
                  value={p.parent_topic}
                  onChange={e => updatePoint(p.id, 'parent_topic', e.target.value)}
                  className="border rounded px-1 w-24 text-xs"
                  placeholder="章节"
                />
              </td>
              <td className="py-2 px-1 text-center">
                <button onClick={() => deletePoint(p.id)} className="text-red-400 hover:text-red-600">
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {points.length === 0 && (
        <p className="text-center text-gray-400 py-4">暂无知识点，请点击"+ 添加考点"或返回上一步重新分析</p>
      )}

      <button
        onClick={onGenerate}
        disabled={loading || points.length === 0}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {loading ? '⏳ 生成中...' : '🚀 生成 4 套试卷'}
      </button>
    </div>
  )
}
