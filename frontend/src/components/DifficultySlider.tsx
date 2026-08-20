import type { DifficultyConfig } from '../types'

interface Props {
  value: DifficultyConfig
  onChange: (v: DifficultyConfig) => void
}

export default function DifficultySlider({ value, onChange }: Props) {
  const handleChange = (key: keyof DifficultyConfig, newVal: number) => {
    const remaining = 100 - newVal
    const others = (['easy', 'medium', 'hard'] as const).filter(k => k !== key)
    const otherTotal = others.reduce((s, k) => s + value[k], 0)
    if (otherTotal === 0) return
    const updated = { ...value, [key]: newVal }
    for (let i = 0; i < others.length; i++) {
      const k = others[i]
      if (i === 0) {
        updated[k] = Math.round(remaining * value[k] / otherTotal)
      } else {
        updated[k] = remaining - updated[others[0]]
      }
    }
    onChange(updated)
  }

  const labels: [keyof DifficultyConfig, string][] = [
    ['easy', '基础'],
    ['medium', '中等'],
    ['hard', '难题'],
  ]

  return (
    <div className="space-y-3">
      {labels.map(([key, label]) => (
        <div key={key} className="flex items-center gap-3">
          <span className="w-12 text-sm text-gray-600">{label}</span>
          <input
            type="range"
            min={0}
            max={100}
            value={value[key]}
            onChange={e => handleChange(key, Number(e.target.value))}
            className="flex-1"
          />
          <span className="w-10 text-sm font-mono">{value[key]}%</span>
        </div>
      ))}
      <div className="flex gap-1 h-2 rounded overflow-hidden">
        <div className="bg-green-400" style={{ width: `${value.easy}%` }} />
        <div className="bg-yellow-400" style={{ width: `${value.medium}%` }} />
        <div className="bg-red-400" style={{ width: `${value.hard}%` }} />
      </div>
    </div>
  )
}
