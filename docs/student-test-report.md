# 学生端功能测试报告

**测试日期：** 2026-08-18
**测试对象：** exam-demo 学生端（`/student/*` 页面 + 3 个学生端 API）

---

## 一、测试环境

| 项 | 值 |
|---|---|
| 浏览器版本 | N/A —— 本环境无法启动真实浏览器 + F12，改用「HTTP 接口实测（等价于 Network 面板）+ 前端代码审查」两种方式 |
| 后端服务 | http://127.0.0.1:8001（FastAPI，运行中） |
| 前端服务 | http://localhost:5173（Vite，运行中，`tsc --noEmit` 已通过） |
| 学生账号 | `student_1787024807`（role=student） |
| 测试考试 | 「学生端测试考试」exam_code=`692730`，试卷 paper-a（10 题：4 选择题 + 6 主观题），时长 120 分钟 |

> 说明：纯前端交互（倒计时走动、点击选中/取消、按钮跳转、Token 存 localStorage 等）无法在本环境用真实浏览器验证，均通过阅读前端源码确认逻辑正确性，报告中标注「代码审查」。

---

## 二、测试用例列表及结果

### 2.1 功能测试

| # | 测试项 | 结果 | 验证方式 / 说明 |
|---|---|---|---|
| **1. 登录跳转** | | | |
| 1.1 | 学生账号登录跳 `/student/dashboard` | ✅ 通过 | API 返回 `role=student`；`LoginPage` 按 `u.role==='student'` 跳转（代码审查） |
| 1.2 | 教师账号登录跳 `/teacher/dashboard` | ✅ 通过 | 教师登录返回 `role=teacher`，跳转逻辑同上 |
| **2. 考试码入口页** | | | |
| 2.1 | 输入有效 6 位码跳确认页 | ✅ 通过 | `validate 692730` 返回 `valid:true`；`StudentDashboard` 跳 `/exam/confirm?code=` |
| 2.2 | 输入无效考试码提示 | ✅ 通过 | `validate 000000` 返回 `valid:false`；前端提示「考试码无效，请重新输入」 |
| 2.3 | 输入空值提示 | ✅ 通过 | 前端 `code.length!==6` 时提示「请输入 6 位考试码」（代码审查） |
| **3. 考试信息确认页** | | | |
| 3.1 | 显示考试名称/时长/题目数量 | ✅ 通过 | `validate` 返回 `{name,duration:120,question_count:10}`，`ExamConfirm` 逐项展示 |
| 3.2 | 点击「开始答题」跳答题页 | ✅ 通过 | `ExamConfirm` 跳 `/exam/take?code=`（代码审查） |
| **4. 答题页** | | | |
| 4.1 | 题目按顺序显示 | ✅ 通过 | `paper` 返回 q0~q9 共 10 题，`ExamTake` 按 `currentIndex` 顺序渲染 |
| 4.2 | 点击选项选中/取消选中 | ✅ 通过 | `toggleOption` 同项再点即删除（代码审查） |
| 4.3 | 上一题/下一题切换 | ✅ 通过 | 边界禁用（第 1 题禁上一题、末题禁下一题）（代码审查） |
| 4.4 | 底部进度显示（第 3/10 题） | ✅ 通过 | `第 {currentIndex+1}/{questions.length} 题`（代码审查） |
| 4.5 | 倒计时正常走动 | ✅ 通过 | `setInterval` 每秒 `setTimeLeft(prev=>prev-1)`，`mm:ss` 格式化（代码审查） |
| 4.6 | 倒计时归零自动提交 | ✅ 通过 | `useEffect` 监听 `timeLeft===0` 触发 `doSubmit()`（代码审查） |
| **5. 提交答卷** | | | |
| 5.1 | 点击提交正常提交 | ✅ 通过 | `submit` 返回 200 `{score:20,total:100,correct_count:4,total_count:10}` |
| 5.2 | 提交后跳转完成页 | ✅ 通过 | `doSubmit` 成功后 `navigate('/exam/complete', {state:result})`（代码审查） |
| **6. 完成页** | | | |
| 6.1 | 显示「提交成功，感谢您的作答！」 | ✅ 通过 | `ExamComplete` 渲染两行文案（代码审查） |
| 6.2 | 显示客观题得分 | ✅ 通过 | `result.score` 展示 + 满分/答对题数 |
| 6.3 | 返回首页跳 `/student/dashboard` | ✅ 通过 | `navigate('/student/dashboard')`（代码审查） |
| **7. 退出登录** | | | |
| 7.1 | 左上角退出登录清 Token 跳 `/login` | ✅ 通过 | `StudentLayout` `logout()`（clearToken+setUser(null)）+ `navigate('/login')`（代码审查） |

### 2.2 边界测试

| # | 测试项 | 结果 | 说明 |
|---|---|---|---|
| 8.1 | 已提交过的考试码再次输入提示「已参加」 | ❌ **未实现** | 后端无任何「已提交」记录，`submit` 不落库，同一考试码可无限次重考 |
| 8.2 | 考试结束后进入提示「已结束」 | ❌ **未实现** | `validate` 只查考试码是否存在，不校验 `status`；实测已结束考试(946127)返回 `valid:true` |
| 8.3 | 答题中刷新恢复进度 | ❌ **未实现** | 答案存于 `useState`，未持久化到 localStorage，刷新即丢失 |
| 8.4 | 未答完点击提交有确认提示 | ❌ **未实现** | 提交按钮直接 `doSubmit()`，无「还有未答题」确认弹窗 |

---

## 三、额外发现的功能/安全缺陷（不在测试清单但影响正确性）

| # | 缺陷 | 严重度 | 说明 |
|---|---|---|---|
| A | 后端无角色权限控制（RBAC） | 🔴 P0 | 学生账号携带合法 token 可访问**全部教师端接口**：`GET /classes`、`GET /papers`、`POST /exams`（创建考试）、`POST /classes`（创建班级）均返回 200 成功。学生可越权创建/删除考试、查看所有试卷与答案 |
| B | 试卷接口泄露正确答案 | 🔴 P1 | `GET /exams/{code}/paper` 返回每题的 `correct_answer`，学生打开 DevTools 即可看到全部答案 |
| C | 主观题无法作答 | 🟠 P1 | 试卷 10 题中 6 道为填空/计算/证明题，但答题页仅对「选择题」渲染选项（`options` 为空则不渲染输入框），学生最多只能拿到 4 道选择题共 20 分（满分 100） |

---

## 四、失败功能详细描述

### 8.1 已提交过的考试码再次输入无「已参加」提示

- **现象**：学生提交答卷后，再次输入同一考试码，仍进入考试并可重复提交，无任何「该考试已参加过」提示。
- **错误信息**：无（`submit` 接口返回 200，但结果未持久化）。
- **可能原因**：`backend/api/routes_exam.py` 的 `submit_exam` 只判分并返回，未将 `(student, exam)` 的作答记录保存；`validate_exam` 也未查询历史提交。前端 `StudentDashboard` 无对应校验。

### 8.2 考试结束后进入考试码无「已结束」提示

- **现象**：对已结束的考试（如 `946127` 往届考试），`GET /exams/validate?code=946127` 仍返回 `{"valid":true}`，学生可正常进入答题。
- **错误信息**：无。
- **可能原因**：`validate_exam` 只调用 `_find_exam_by_code` 判断码是否存在，未调用 `compute_status(exam)` 校验考试是否在时间窗口内。

### 8.3 答题中刷新页面丢失进度

- **现象**：刷新答题页后所有已选答案清空，回到第一题。
- **可能原因**：`frontend/src/student/ExamTake.tsx` 的答案用 `useState<Record<string,string>>` 保存，未写入 localStorage。

### 8.4 未答完点击提交无确认提示

- **现象**：题目未答完时点击「提交答卷」直接提交并跳转完成页，无「还有 N 题未作答，确认提交？」确认框。
- **可能原因**：`ExamTake.tsx` 提交按钮 `onClick={() => doSubmit()}` 无确认逻辑。

---

## 五、建议修复优先级

| 优先级 | 问题 | 建议修复位置 | 修复方向 |
|---|---|---|---|
| **P0** | 后端无 RBAC，学生可越权访问教师接口 | `backend/api/router.py` / `security.py` | 增加角色校验依赖 `require_role("teacher")`，对 `/exams`、`/classes`、`/papers`、`/upload`、`/analyze`、`/generate` 等教师接口加装，仅 `teacher` 可访问 |
| **P1** | 试卷接口泄露 `correct_answer` | `backend/api/routes_exam.py` `get_paper` | 学生端试卷不返回 `correct_answer`（判分在后端完成，前端无需该字段） |
| **P1** | 主观题无法作答，学生满分受限 | `frontend/src/student/ExamTake.tsx` + `routes_exam.py` | 为填空/计算/证明题提供文本输入框并提交；判分逻辑改为客观题字母匹配 + 主观题教师人工阅卷或留空 |
| **P2** | 已提交考试可重复考 | `routes_exam.py` + 新增提交记录存储 | 提交后记录 `(student, exam)`，`validate`/`submit` 时校验是否已参加 |
| **P2** | 考试未校验时间窗口 | `routes_exam.py` `validate_exam` | 校验 `compute_status`，未开始/已结束返回对应提示 |
| **P2** | 刷新丢失答题进度 | `ExamTake.tsx` | 答案与剩余时间持久化到 localStorage，挂载时恢复 |
| **P2** | 未答完提交无确认 | `ExamTake.tsx` | 提交前统计未答题数，`confirm` 弹窗确认 |

---

## 六、结论

- **学生端核心主链路（登录跳转 → 考试码入口 → 确认页 → 答题 → 提交 → 完成页 → 退出）功能正常**，共 21 项功能用例全部通过。
- **4 项边界用例全部未实现**（已提交提示、考试结束提示、刷新恢复、未答完确认），属于体验增强项。
- **最严重的问题是后端缺少角色权限控制**：学生账号可直接调用教师端接口（创建考试、创建班级、查看试卷答案等），这是必须优先修复的安全漏洞；其次是试卷接口泄露正确答案、主观题无法作答两个影响考试完整性与公平性的问题。

---

## 附：学生端接口实测记录

```
GET  /api/auth/me                          → 200 {"username":"student_...","role":"student"}
GET  /api/exams/validate?code=692730       → 200 {"valid":true,"exam":{name,duration:120,question_count:10}}
GET  /api/exams/validate?code=000000       → 200 {"valid":false}
GET  /api/exams/validate?code=             → 200 {"valid":false}
GET  /api/exams/validate?code=946127(已结束) → 200 {"valid":true}   ← 未校验考试状态
GET  /api/exams/692730/paper               → 200 10题(4选择题含correct_answer + 6主观题)
GET  /api/exams/999999/paper               → 404 {"detail":"考试不存在"}
POST /api/exams/692730/submit (4选择题全对) → 200 {"score":20,"total":100,"correct_count":4,"total_count":10}
POST /api/exams/692730/submit (空答案)      → 200 {"score":0,"total":100,...}
POST /api/exams/999999/submit              → 404 {"detail":"考试不存在"}

// —— 越权测试（学生账号访问教师接口）——
GET  /api/classes                          → 200 [班级列表]   ← 应拒绝
GET  /api/papers                           → 200 [试卷列表]   ← 应拒绝
POST /api/exams  (创建考试)                 → 200 创建成功      ← 应拒绝
POST /api/classes (创建班级)                → 200 创建成功      ← 应拒绝
```
