# exam-demo 教师端功能测试报告

**测试日期：** 2026-08-18
**测试对象：** exam-demo 项目（后端 FastAPI + 前端 React/Vite）
**测试人：** 自动化测试（Claude Code）

---

## 一、测试环境与方法

| 项 | 值 |
|---|---|
| 后端 | `D:\python-3.10.1\python.exe -m uvicorn main:app --port 8001`（运行中） |
| 前端 | `npm run dev`（Vite，http://localhost:5173，运行中） |
| 数据库 | SQLite（`backend/exam.db`），内存存储 papers/exams/classes |
| 大模型 | DeepSeek（`deepseek-v4-pro`，API Key 有效，模型名有效） |

**测试方法说明：** 本环境无法打开真实浏览器 + F12，故采用以下等效方式：
- **后端**：直接发起与浏览器一致的 HTTP 请求（`curl` / Python `httpx`），逐项验证接口返回的状态码与数据，等价于浏览器 Network 面板的监控结果。
- **前端**：启动 dev server 验证可编译、可访问；涉及纯前端交互（跳转、弹窗、Tab、Token 存 localStorage 等）通过代码审查确认逻辑。

> 注：终端输出中的中文显示为乱码，是 Windows 控制台 GBK 编码的**显示问题**，非程序缺陷。已用 UTF-8 校验确认后端存储的中文数据完全正确（`计科1班` 等码点逐一匹配）。

---

## 二、测试结果总览

| 分类 | 通过 | 失败 | 合计 |
|---|---|---|---|
| 登录/注册 | 5 | 0 | 5 |
| 命题工作台 | 3 | 1（P0 阻断） | 4 |
| 考试发布 | 3 | 0 | 3 |
| 班级管理 | 3 | 0（含 1 个次要缺陷） | 3 |
| 数据看板 | 4 | 0 | 4 |
| 边界测试 | 4 | 1 | 5 |
| **合计** | **22** | **2** | **24** |

---

## 三、功能测试详细结果

### 3.1 登录 / 注册（5/5 通过 ✅）

| # | 测试项 | 结果 | 说明 |
|---|---|---|---|
| 1 | 注册新用户（教师角色）成功后跳转登录页 | ✅ 通过 | `POST /api/auth/register` 返回 `{"success":true}`；前端 `RegisterPage` 注册后 `navigate('/login')` |
| 2 | 登录成功、Token 存入 localStorage | ✅ 通过 | `POST /api/auth/login` 返回 `token`+`user`；前端 `setToken` 写入 `localStorage['auth_token']` |
| 3 | 登录后右上角显示用户名和角色 | ✅ 通过 | `NavBar` 展示 `user.username` + 角色标签（教师/学生） |
| 4 | 退出登录清除 Token 并跳转登录页 | ✅ 通过 | `logout()` → `clearToken`+`setUser(null)` + `navigate('/login')` |
| 5 | 未登录访问首页自动跳转登录页 | ✅ 通过 | `ProtectedRoute` 无 token 时 `<Navigate to="/login" />` |

### 3.2 命题工作台（3/4 通过，1 个 P0 阻断 ❌）

| # | 测试项 | 结果 | 说明 |
|---|---|---|---|
| 6 | 上传 PDF/Word 文件 | ✅ 通过 | `POST /api/upload` 返回文件列表，文件正确保存到 `uploads/` |
| 7 | 点击「开始分析」返回知识点列表 | ❌ **失败** | 见下方「失败功能 1」 |
| 8 | 知识点列表编辑/删除/添加 | ✅ 通过 | 前端 `Step2Knowledge` 纯客户端状态操作，逻辑正确 |
| 9 | 生成 4 套试卷返回试卷列表 | ✅ 通过 | 生成 paper-a~paper-d 各 10 题，但耗时约 5 分钟（见缺陷 4） |
| 10 | Tab 切换查看不同试卷 | ✅ 通过 | `Step3Papers` 通过 `active` 状态切换，逻辑正确 |

### 3.3 考试发布（3/3 通过 ✅）

| # | 测试项 | 结果 | 说明 |
|---|---|---|---|
| 11 | 创建考试（名称/时间/时长/班级） | ✅ 通过 | `POST /api/exams` 返回完整考试对象 |
| 12 | 生成 6 位考试码并显示 | ✅ 通过 | 自动生成 6 位码（如 `589956`） |
| 13 | 创建的考试出现在列表 | ✅ 通过 | `GET /api/exams` 正确列出，含动态状态（未开始/进行中/已结束） |

### 3.4 班级管理（3/3 通过，含 1 个次要缺陷 ⚠️）

| # | 测试项 | 结果 | 说明 |
|---|---|---|---|
| 14 | 创建班级 | ✅ 通过 | `POST /api/classes` 返回班级对象；重名返回 400「班级已存在」 |
| 15 | 批量导入学生（文本框粘贴） | ✅ 通过（⚠️） | 导入成功，但同批内重复姓名不自动去重（见缺陷 5） |
| 16 | 学生列表显示 | ✅ 通过 | 班级详情正确返回学生数组 |

### 3.5 数据看板（4/4 通过 ✅）

| # | 测试项 | 结果 | 说明 |
|---|---|---|---|
| 17 | 考试列表显示 | ✅ 通过 | 仅显示「已结束」状态的考试（`status=finished`），符合设计 |
| 18 | 查看报告显示统计指标 | ✅ 通过 | 平均分/及格率/最高分/最低分均正确返回 |
| 19 | 分数段分布图 | ✅ 通过 | `score_distribution` 返回 5 段数据，前端 echarts 渲染 |
| 20 | 每题正确率 | ✅ 通过 | `question_correctness` 返回逐题正确率 |

---

## 四、边界测试结果（4/5 通过）

| # | 测试项 | 结果 | 实际表现 |
|---|---|---|---|
| 21 | 注册时用户名已存在 | ✅ 通过 | 返回 `400 {"detail":"用户名已存在"}`，前端提示错误 |
| 22 | 登录时用户名/密码错误 | ✅ 通过 | 返回 `401 {"detail":"用户名或密码错误"}` |
| 23 | 输入无效考试码 | ✅ 通过 | `GET /api/exams/validate?code=000000` 返回 `{"valid":false}`，前端提示「考试码无效」 |
| 24 | 上传非 PDF/Word 文件 | ❌ **失败** | 见下方「失败功能 2」 |
| 25 | 未选择文件直接点「开始分析」 | ✅ 通过 | 前端 `Step1Upload` 弹窗「请上传试卷文件」 |

---

## 五、失败功能详情

### 失败 1（P0 阻断）：上传后「开始分析」100% 失败

- **错误现象：** 命题工作台第 1 步上传文件成功，但点击「开始分析」后，任务立即进入 `failed` 状态，永远拿不到知识点列表，整个「命题 → 生成试卷」流程被阻断。
- **错误信息：**
  ```
  task status = failed
  error = "[Errno 2] No such file or directory: 'test_sample.pdf'"
  ```
- **可能原因（根因已定位）：**
  - 上传接口 `backend/api/router.py` 将文件保存到 `UPLOAD_DIR = .../exam-demo/uploads/`。
  - 但前端只把**文件名**（如 `test_sample.pdf`）回传给 `/analyze`。
  - `services/analyze.py` 的 `parse_file()` 直接用该裸文件名 `pdfplumber.open("test_sample.pdf")`，按**后端进程的工作目录**（`backend/`）解析，而非 `uploads/` 目录，导致文件找不到。
- **影响范围：** 命题工作台核心链路（上传 → 分析 → 生成）中，分析步骤不可用。

### 失败 2（P1）：上传非 PDF/Word 文件无任何提示

- **错误现象：** 通过拖拽或选择器上传 `.txt` 等非 PDF/Word 文件，接口正常返回 200，文件被静默保存，没有任何提示。
- **错误信息：** `POST /api/upload` 对 `.txt` 文件返回 `200 {"files":[{"filename":"test_sample.txt","size":29}]}`。
- **可能原因（根因已定位）：**
  - 后端 `/upload` 未做文件类型校验（`router.py` 直接 `copyfileobj` 保存任意文件）。
  - 前端 `<input accept=".pdf,.docx,.doc">` 只在文件选择器里做了弱过滤，拖拽（`handleDrop`）完全不过滤，且 `accept` 可被绕过。
  - 非法文件要等到「分析」阶段才会在 `parse_file` 抛 `不支持的文件格式`，但此时又叠加了失败 1 的路径 bug，用户只会看到「文件不存在」。

---

## 六、发现的缺陷清单与修复优先级

| 优先级 | 缺陷 | 位置 | 建议修复 |
|---|---|---|---|
| **P0** | 分析阶段文件路径解析错误（失败 1） | `backend/api/router.py`（analyze 端点）/ `services/analyze.py` | 分析前把文件名解析为绝对路径：`full = os.path.join(UPLOAD_DIR, f) if not os.path.isabs(f) else f`，再传给 `run_analysis` |
| **P1** | 上传接口无文件类型校验（失败 2） | `backend/api/router.py`（upload 端点） | 校验扩展名仅允许 `.pdf/.docx/.doc`，否则返回 400 提示 |
| **P2** | 前端「分析/生成超时」错误误报 | `frontend/src/components/ExamMaker.tsx:55`、`:91` | `if (step === 1)` 用了闭包里的旧值，成功/失败后都会额外弹「超时」，失败时还会覆盖真实错误。改用局部布尔标志判断循环是否正常结束 |
| **P2** | 生成 4 套试卷耗时约 5 分钟，贴近超时上限 | `services/generate.py`（httpx timeout=300）/ `ExamMaker.tsx`（120×3s） | 后端 300s 超时、前端 360s 轮询都接近 5 分钟临界值，网络慢时易超时。建议后端提升超时、前端增加轮询次数或改为后端流式返回 |
| **P2** | 批量导入学生同批重复不去重 | `backend/api/routes_class.py:47-51` | `added = [n for n in names if n not in existing]` 未把本轮已加的名字纳入去重，同批重复会重复入库。改为在遍历中维护 seen 集合 |
| **P2** | 后端创建考试未校验空名称 | `backend/api/routes_exam.py:56` | 前端已校验，但 API 层未校验，`name=""` 可直接创建。补一个非空校验 |

---

## 七、结论

- 登录/注册、考试发布、班级管理、数据看板四大模块功能正常，边界场景（重名、错误密码、无效考试码、空文件提示）大多有正确提示。
- **最严重问题是「命题工作台」的分析步骤因文件路径 bug 完全不可用**，这会阻断从上传往年试卷到生成模拟卷的完整核心流程，属于必须优先修复的 P0 问题。
- 其余为体验类/健壮性缺陷，建议按上表优先级依次修复。

---

## 附：测试过程关键接口实测记录

```
POST /api/auth/register (new)          → 200 {"success":true,"message":"注册成功"}
POST /api/auth/register (duplicate)    → 400 {"detail":"用户名已存在"}
POST /api/auth/login  (correct)        → 200 {token, user:{username,role:teacher}}
POST /api/auth/login  (wrong pass)     → 401 {"detail":"用户名或密码错误"}
GET  /api/auth/me     (with token)     → 200 {"username":...,"role":"teacher"}
GET  /api/auth/me     (no token)       → 401 {"detail":"未登录"}
POST /api/upload      (pdf+docx)       → 200 {files:[...]}
POST /api/upload      (txt)            → 200 {files:[...]}   ← 无类型校验
POST /api/analyze     (bare filename)  → 任务 failed: "[Errno 2] No such file or directory"
POST /api/generate    (2 kp)           → 任务 completed: 4 papers × 10 题（约 5 分钟）
GET  /api/papers                        → 200 [paper-a..paper-d]
GET  /api/papers/{id}/download (pdf)    → 200 application/pdf (33067 B, %PDF)
GET  /api/papers/{id}/download (docx)   → 200 docx (38259 B, PK)
POST /api/classes     (new)            → 200 {id,name,students:[]}
POST /api/classes     (duplicate)      → 400 {"detail":"班级已存在"}
POST /api/classes/{id}/students        → 200 {students:[...],added:4}  ← 同批重复未去重
POST /api/exams       (future time)    → 200 {exam_code:"589956",status:pending}
POST /api/exams       (empty name)     → 200 {name:""}   ← 后端未校验空名
GET  /api/exams?status=finished        → 200 [往届考试]
GET  /api/exams/{id}/report            → 200 {avg_score:72.5,pass_rate:0.5,...}
GET  /api/exams/{pending_id}/report    → 400 {"detail":"考试尚未结束，暂无成绩"}
GET  /api/exams/validate?code=589956   → 200 {"valid":true,...}
GET  /api/exams/validate?code=000000   → 200 {"valid":false}
```
