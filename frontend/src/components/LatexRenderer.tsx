import { useEffect, useRef } from 'react'
import katex from 'katex'

interface Props {
  text: string
  className?: string
}

export default function LatexRenderer({ text, className }: Props) {
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = renderLatex(text)
  }, [text])

  return <span ref={containerRef} className={className} />
}

// 占位符用不可见字符包裹数字，用于保护已渲染的 KaTeX HTML，
// 避免被后续“裸 LaTeX”扫描当作普通文本二次处理。
const TOKEN = '\u0000'
const TOKEN_RE = /\u0000(\d+)\u0000/g

// 一段连续的“数学字符”（不含空格、不含中文），在中文边界自然断开。
const RAW_MATH = /[A-Za-z0-9\\{}_^+\-*/=()[\].,:;|]+/g
// 判定该片段是否真是数学：含下标/上标，或含 LaTeX 命令（\ + 字母）。
const HAS_MATH_SIGNAL = /[_^]|\\[A-Za-z]/

function renderLatex(raw: string): string {
  let html = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const rendered: string[] = []

  const toMath = (formula: string, displayMode: boolean): string => {
    const id = TOKEN + rendered.length + TOKEN
    // 还原被 HTML 转义吞掉的 < > &，再交给 KaTeX
    const f = formula
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim()
    try {
      rendered.push(katex.renderToString(f, { displayMode, throwOnError: false }))
    } catch {
      rendered.push(formula) // 转义后的原文，安全回退
    }
    return id
  }

  // 1) 块级公式：$$...$$ 与 \[...\]
  html = html.replace(
    /\$\$([^$]+)\$\$|\\\[([\s\S]+?)\\\]/g,
    (_, dollar, bracket) => toMath(dollar ?? bracket ?? '', true),
  )

  // 2) 行内公式：$...$ 与 \(...\)
  html = html.replace(
    /\$([^$]+)\$|\\\(([\s\S]+?)\\\)/g,
    (_, dollar, paren) => toMath(dollar ?? paren ?? '', false),
  )

  // 3) 未包裹的裸 LaTeX（下标/上标/命令，如 x_1、x^2、a_{n+1}、\{a_n\}、\frac{1}{2}）
  html = html.replace(RAW_MATH, (run) => {
    if (!HAS_MATH_SIGNAL.test(run)) return run
    return toMath(run, false)
  })

  // 还原占位符
  return html.replace(TOKEN_RE, (_, i) => rendered[Number(i)])
}
