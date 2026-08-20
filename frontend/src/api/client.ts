import type { AnalyzeRequest, GenerateRequest, TaskStatus, UploadedFile, PaperBrief, Exam, ExamCreate, ClassInfo, ExamReport, LoginResponse, UserInfo, ExamValidateResponse, StudentPaper, SubmitResult } from '../types'

const BASE = 'http://localhost:8001/api'
const FETCH_TIMEOUT = 300000 // 5 minutes
const TOKEN_KEY = 'auth_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

async function request(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
  const token = getToken()
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  try {
    const res = await fetch(url, { ...options, headers, signal: controller.signal })
    if (res.status === 401 && token) {
      clearToken()
      window.location.href = '/login'
    }
    return res
  } finally {
    clearTimeout(timer)
  }
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json()
    if (typeof data?.detail === 'string') return data.detail
  } catch {}
  return '请求失败'
}

export async function uploadFiles(files: File[]): Promise<UploadedFile[]> {
  const form = new FormData()
  files.forEach(f => form.append('files', f))
  const res = await request(`${BASE}/upload`, { method: 'POST', body: form })
  if (!res.ok) throw new Error('上传失败')
  const data = await res.json()
  return data.files
}

export async function analyze(data: AnalyzeRequest): Promise<{ task_id: string }> {
  const res = await request(`${BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('分析请求失败')
  return res.json()
}

export async function getTaskStatus(taskId: string): Promise<TaskStatus> {
  const res = await request(`${BASE}/task/${taskId}`)
  if (!res.ok) throw new Error('查询任务失败')
  return res.json()
}

export async function generate(data: GenerateRequest): Promise<{ task_id: string }> {
  const res = await request(`${BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('生成请求失败')
  return res.json()
}

export function getDownloadUrl(paperId: string, format: 'pdf' | 'docx'): string {
  return `${BASE}/papers/${paperId}/download?format=${format}`
}

export async function getPapers(): Promise<PaperBrief[]> {
  const res = await request(`${BASE}/papers`)
  if (!res.ok) throw new Error('获取试卷列表失败')
  return res.json()
}

export async function createExam(data: ExamCreate): Promise<Exam> {
  const res = await request(`${BASE}/exams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('创建考试失败')
  return res.json()
}

export async function getExams(): Promise<Exam[]> {
  const res = await request(`${BASE}/exams`)
  if (!res.ok) throw new Error('获取考试列表失败')
  return res.json()
}

export async function deleteExam(id: string): Promise<void> {
  const res = await request(`${BASE}/exams/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('删除考试失败')
}

// --- 班级管理 ---
export async function getClasses(): Promise<ClassInfo[]> {
  const res = await request(`${BASE}/classes`)
  if (!res.ok) throw new Error('获取班级列表失败')
  return res.json()
}

export async function createClass(name: string): Promise<ClassInfo> {
  const res = await request(`${BASE}/classes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error('创建班级失败')
  return res.json()
}

export async function importStudents(classId: string, students: string[]): Promise<{ students: string[]; added: number }> {
  const res = await request(`${BASE}/classes/${classId}/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ students }),
  })
  if (!res.ok) throw new Error('导入学生失败')
  return res.json()
}

export async function deleteClass(id: string): Promise<void> {
  const res = await request(`${BASE}/classes/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('删除班级失败')
}

// --- 数据看板 ---
export async function getFinishedExams(): Promise<Exam[]> {
  const res = await request(`${BASE}/exams?status=finished`)
  if (!res.ok) throw new Error('获取已结束考试失败')
  return res.json()
}

export async function getExamReport(examId: string): Promise<ExamReport> {
  const res = await request(`${BASE}/exams/${examId}/report`)
  if (!res.ok) throw new Error('获取考试报告失败')
  return res.json()
}

// --- 登录认证 ---
export async function loginUser(username: string, password: string): Promise<LoginResponse> {
  const res = await request(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

export async function getCurrentUser(): Promise<UserInfo> {
  const res = await request(`${BASE}/auth/me`)
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

export async function registerUser(username: string, password: string, role: string): Promise<void> {
  const res = await request(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role }),
  })
  if (!res.ok) throw new Error(await errorMessage(res))
}

// --- 学生端 ---
export async function validateExamCode(code: string): Promise<ExamValidateResponse> {
  const res = await request(`${BASE}/exams/validate?code=${encodeURIComponent(code)}`)
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

export async function getExamPaper(code: string): Promise<StudentPaper> {
  const res = await request(`${BASE}/exams/${encodeURIComponent(code)}/paper`)
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}

export async function submitExam(code: string, answers: { question_id: string; selected_option: string }[]): Promise<SubmitResult> {
  const res = await request(`${BASE}/exams/${encodeURIComponent(code)}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.json()
}
