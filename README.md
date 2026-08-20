# AI 命题系统 Demo

上传往年试卷 → AI 提取知识点 → 教师修正 → 生成 4 套模拟卷 → 下载 PDF/Word

## 快速启动

### 1. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填写 DeepSeek API Key
```

### 2. 启动后端

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

后端运行在 http://localhost:8000，Swagger 文档在 http://localhost:8000/docs

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端运行在 http://localhost:5173

### 4. 使用流程

1. 填写课程名、考试范围，上传往年试卷（PDF/Word），调整难度比例 → 点"开始分析"
2. 查看 AI 提取的知识点列表，可在线增删改 → 点"生成试卷"
3. 4 套试卷分 Tab 预览，每套可下载 PDF 或 Word

## 技术栈

- 前端: Vite + React + TypeScript + Tailwind CSS 4
- 后端: FastAPI + Python
- AI: DeepSeek API (deepseek-v4-pro)
- 文件解析: pdfplumber + python-docx
- 文件生成: fpdf2 + python-docx

## 项目结构

```
exam-demo/
├── .env.example
├── README.md
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── requirements.txt
│   ├── models/schemas.py
│   ├── api/router.py
│   └── services/
│       ├── parse.py
│       ├── analyze.py
│       └── generate.py
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── App.css
│       ├── main.tsx
│       ├── types/index.ts
│       ├── api/client.ts
│       └── components/
│           ├── DifficultySlider.tsx
│           ├── Step1Upload.tsx
│           ├── Step2Knowledge.tsx
│           └── Step3Papers.tsx
├── uploads/    (运行时)
└── output/     (运行时)
```
