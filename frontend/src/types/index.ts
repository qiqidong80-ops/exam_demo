export interface DifficultyConfig {
  easy: number
  medium: number
  hard: number
}

export interface KnowledgePoint {
  id: string
  name: string
  difficulty: 'easy' | 'medium' | 'hard'
  parent_topic: string
  question_refs: string[]
}

export interface Question {
  type: string
  stem: string
  difficulty: string
  score: number
  answer: string
  analysis: string
}

export interface Paper {
  id: string
  title: string
  questions: Question[]
}

export interface TaskStatus {
  task_id: string
  status: 'processing' | 'completed' | 'failed'
  progress: string
  result: { knowledge_points?: KnowledgePoint[]; papers?: Paper[] } | null
  error: string | null
}

export interface UploadedFile {
  filename: string
  size: number
}

// --- 试卷简要信息 ---
export interface PaperBrief {
  id: string
  title: string
}

// --- 考试发布 ---
export interface AntiCheatConfig {
  shuffle_questions: boolean
  tab_switch_detection: boolean
}

export interface Exam {
  id: string
  name: string
  paper_id: string
  paper_title: string
  exam_code: string
  exam_time: string
  duration_minutes: number
  class_ids: string[]
  classes: string[]
  anti_cheat: AntiCheatConfig
  status: 'pending' | 'active' | 'finished'
  participant_count?: number
  created_at: string
}

export interface ExamCreate {
  name: string
  paper_id: string
  exam_time: string
  duration_minutes: number
  class_ids: string[]
  anti_cheat: AntiCheatConfig
}

// --- 班级管理 ---
export interface ClassInfo {
  id: string
  name: string
  students: string[]
  created_at: string
}

// --- 数据看板 ---
export interface ExamReport {
  exam_id: string
  exam_name: string
  exam_code: string
  participant_count: number
  avg_score: number
  pass_rate: number
  max_score: number
  min_score: number
  score_distribution: number[]
  question_correctness: number[]
  students: { student_name: string; score: number }[]
}

// --- 原有 ---
export interface AnalyzeRequest {
  course: string
  scope: string
  files: string[]
  difficulty: DifficultyConfig
}

export interface GenerateRequest {
  course: string
  scope: string
  knowledge_points: KnowledgePoint[]
  difficulty: DifficultyConfig
  reference_texts: string[]
}

// --- 登录认证 ---
export interface UserInfo {
  username: string
  role: 'teacher' | 'student'
}

export interface LoginResponse {
  token: string
  user: UserInfo
}

// --- 学生端 ---
export interface ExamValidateResponse {
  valid: boolean
  exam?: { id: string; name: string; duration: number; question_count: number }
  submitted?: boolean
  reason?: 'pending' | 'finished'
}

export interface StudentQuestion {
  id: string
  type: string
  content: string
  options: string[]
}

export interface StudentPaper {
  questions: StudentQuestion[]
}

export interface SubmitResult {
  score: number
  total: number
  correct_count: number
  total_count: number
}
