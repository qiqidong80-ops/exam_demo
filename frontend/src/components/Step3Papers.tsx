import { useState } from 'react'
import type { Paper } from '../types'
import { getDownloadUrl } from '../api/client'
import LatexRenderer from './LatexRenderer'

interface Props {
  papers: Paper[]
}

export default function Step3Papers({ papers }: Props) {
  const [active, setActive] = useState(0)
  const paper = papers[active]

  if (!paper) {
    return <p className="text-gray-500 text-center py-8">暂无试卷数据</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {papers.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setActive(i)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              i === active ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            试卷 {String.fromCharCode(65 + i)}
          </button>
        ))}
      </div>

      <div className="border rounded-lg p-6 space-y-4 bg-white shadow-sm">
        <h3 className="text-lg font-bold text-center">{paper.title}</h3>

        {paper.questions.map((q, i) => (
          <div key={i} className="border-b pb-3 last:border-b-0">
            <p className="font-medium">
              {i + 1}. [{q.type}] ({q.score}分){' '}
              <span className="text-xs text-gray-400">[{q.difficulty}]</span>
            </p>
            <p className="mt-1 text-gray-700"><LatexRenderer text={q.stem} /></p>
          </div>
        ))}

        <hr />
        <h4 className="font-bold text-center text-lg">参考答案</h4>

        {paper.questions.map((q, i) => (
          <div key={i} className="text-sm">
            <p>
              <strong>{i + 1}.</strong> <LatexRenderer text={q.answer} />
            </p>
            {q.analysis && <p className="text-gray-500 mt-1">解析: <LatexRenderer text={q.analysis} /></p>}
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-center">
        <a
          href={getDownloadUrl(paper.id, 'pdf')}
          target="_blank"
          rel="noreferrer"
          className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          📥 下载 PDF
        </a>
        <a
          href={getDownloadUrl(paper.id, 'docx')}
          target="_blank"
          rel="noreferrer"
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          📥 下载 Word
        </a>
      </div>
    </div>
  )
}
