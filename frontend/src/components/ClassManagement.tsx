import { useState, useEffect, useCallback, useRef } from 'react'
import * as XLSX from 'xlsx'
import type { ClassInfo } from '../types'
import { getClasses, createClass, importStudents, deleteClass } from '../api/client'

export default function ClassManagement() {
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [importMode, setImportMode] = useState<'text' | 'csv'>('text')
  const fileRef = useRef<HTMLInputElement>(null)

  const loadClasses = useCallback(async () => {
    try {
      const data = await getClasses()
      setClasses(data)
    } catch {
      // 接口不可用时静默
    }
  }, [])

  useEffect(() => { loadClasses() }, [loadClasses])

  const activeClass = classes.find(c => c.id === activeId)

  const handleCreate = async () => {
    if (!newName.trim()) { setError('请输入班级名称'); return }
    setError('')
    try {
      await createClass(newName.trim())
      setNewName('')
      await loadClasses()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '创建失败')
    }
  }

  const handlePasteImport = async () => {
    if (!activeId) return
    const names = pasteText.split(/\n/).map(s => s.trim()).filter(Boolean)
    if (names.length === 0) { setError('请输入学生姓名'); return }
    setError('')
    try {
      await importStudents(activeId, names)
      setPasteText('')
      await loadClasses()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '导入失败')
    }
  }

  const handleCsvImport = async (file: File) => {
    if (!activeId) return
    try {
      const data = await file.arrayBuffer()
      const wb = XLSX.read(data)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1 })
      const names = rows.map(r => String(r[0] ?? '').trim()).filter(Boolean)
      await importStudents(activeId, names)
      await loadClasses()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'CSV 解析失败')
    }
  }

  const handleDelete = async (id: string) => {
    await deleteClass(id)
    if (activeId === id) setActiveId(null)
    await loadClasses()
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <h2 className="text-xl font-bold mb-6">班级管理</h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="font-bold text-lg leading-none">&times;</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左栏：班级列表 + 创建 */}
        <div className="lg:col-span-1">
          <div className="flex gap-2 mb-3">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="flex-1 border rounded px-3 py-2 text-sm"
              placeholder="班级名称，如: 计科1班"
            />
            <button
              onClick={handleCreate}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              创建
            </button>
          </div>

          {classes.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center border rounded-lg">暂无班级</p>
          ) : (
            <div className="space-y-2">
              {classes.map(c => (
                <div
                  key={c.id}
                  className={`border rounded-lg p-3 flex justify-between items-center cursor-pointer transition-colors ${
                    activeId === c.id ? 'border-blue-500 bg-blue-50' : 'bg-white hover:border-gray-300'
                  }`}
                  onClick={() => setActiveId(c.id)}
                >
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.students.length} 名学生</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(c.id) }}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 右栏：班级详情 */}
        <div className="lg:col-span-2 border rounded-lg p-6 bg-white shadow-sm">
          {!activeClass ? (
            <p className="text-gray-400 text-center py-16">点击左侧班级查看详情</p>
          ) : (
            <>
              <h3 className="font-medium mb-4">{activeClass.name} — 学生名单 ({activeClass.students.length})</h3>

              {/* 学生列表 */}
              {activeClass.students.length === 0 ? (
                <p className="text-gray-400 text-sm py-4">暂无学生，请在下方导入</p>
              ) : (
                <div className="flex flex-wrap gap-2 mb-4">
                  {activeClass.students.map((s, i) => (
                    <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm">{s}</span>
                  ))}
                </div>
              )}

              {/* 批量导入 */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">批量导入学生</h4>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setImportMode('text')}
                    className={`px-3 py-1 text-sm rounded ${importMode === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  >
                    文本框粘贴
                  </button>
                  <button
                    onClick={() => setImportMode('csv')}
                    className={`px-3 py-1 text-sm rounded ${importMode === 'csv' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  >
                    CSV 上传
                  </button>
                </div>

                {importMode === 'text' ? (
                  <div>
                    <textarea
                      value={pasteText}
                      onChange={e => setPasteText(e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm h-28"
                      placeholder={'每行一个学生姓名\n张三\n李四\n王五'}
                    />
                    <button
                      onClick={handlePasteImport}
                      className="mt-2 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                    >
                      导入
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) handleCsvImport(f)
                        e.target.value = ''
                      }}
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                    >
                      上传 CSV 文件
                    </button>
                    <p className="text-xs text-gray-400 mt-2">CSV 第一列为学生姓名</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
