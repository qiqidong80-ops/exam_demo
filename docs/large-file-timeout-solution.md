# 大文件上传分析超时 — 解决方案文档

## 问题诊断

当前 AI 命题系统在处理大型试卷文件（PDF/Word）时面临以下超时瓶颈：

### 瓶颈分析

| 层级 | 位置 | 当前值 | 问题 |
|------|------|--------|------|
| 后端 HTTP 客户端 | `services/analyze.py` | 120s | DeepSeek API 分析大文本时不够用 |
| 后端 HTTP 客户端 | `services/generate.py` | 300s | 生成 4 套试卷可能超过 5 分钟 |
| 前端 fetch | `api/client.ts` | 300s (5min) | 上传大文件时连接可能断开 |
| 前端轮询(分析) | `App.tsx` | 60次 × 2s = 120s | 轮询可能在分析完成前超时 |
| 前端轮询(生成) | `App.tsx` | 120次 × 3s = 360s | 生成大量试卷可能超时 |
| 文本截断 | `services/analyze.py` | `[:60000]` 简单截断 | 尾部内容完全丢失，影响分析质量 |

### 根因总结

1. **API 调用超时**: DeepSeek API 处理长文本需要更长时间
2. **文本截断粗暴**: 直接截断前 60000 字符，大文件丢失尾部内容
3. **轮询策略硬编码**: 固定次数 × 固定间隔，不适应实际耗时
4. **单次请求过重**: 4 套试卷一次生成，token 量大，耗时长

## 已实施的改进

### 1. 后端超时调整

```python
# services/analyze.py - 从 120s 提升到 300s
async with httpx.AsyncClient(timeout=300) as client:

# services/generate.py - 保持 300s
async with httpx.AsyncClient(timeout=300) as client:
```

### 2. 智能文本截断

将粗暴的 `text[:60000]` 替换为保留头、尾、中的采样策略：

```python
def smart_truncate(text: str, max_chars: int = 60000) -> str:
    """保留开头 1/3、中间 1/3、结尾 1/3，确保不丢失尾部重要内容。"""
    if len(text) <= max_chars:
        return text
    head_size = max_chars // 3
    tail_size = max_chars // 3
    mid_size = max_chars - head_size - tail_size
    mid_start = (len(text) - mid_size) // 2
    return (
        text[:head_size] +
        "\n\n... [中间内容省略] ...\n\n" +
        text[mid_start:mid_start + mid_size] +
        "\n\n... [中间内容省略] ...\n\n" +
        text[-tail_size:]
    )
```

### 3. 进度提示（配合超时体验）

后端在不同阶段更新任务进度，前端实时显示：
- "正在上传文件..."
- "正在解析试卷..."
- "正在调用 AI 分析知识点..."
- "正在调用 AI 生成试卷（预计 2-5 分钟）..."

## 进阶方案（生产环境推荐）

### 方案 A: 流式生成 (SSE)

将 DeepSeek API 调用改为 `stream=True`，通过 SSE 向前端推送实时进度。

**优点**: 用户可看到生成过程，不会觉得"卡住了"
**实现要点**:
- `client.post(..., json={..., "stream": True})`
- 后端用 `StreamingResponse` 逐块转发
- 前端用 `EventSource` 或 `fetch` + `ReadableStream` 接收

### 方案 B: 文件分片上传

对大文件进行分片上传，避免单次请求过大。

**优点**: 解决网络不稳定导致的上传失败
**实现要点**:
- 前端用 `File.slice()` 分片
- 后端提供 `/upload/chunk` 和 `/upload/merge` 接口
- 每片带 `chunk_index` 和 `total_chunks`

### 方案 C: 任务队列 (Celery/Redis)

将分析、生成任务放入消息队列，异步处理。

**优点**: 支持水平扩展、任务持久化、失败重试
**实现要点**:
- 使用 Celery + Redis 作为消息队列
- WebSocket 推送任务进度
- 设置 `task_soft_time_limit` 和 `task_time_limit`

### 方案 D: 分卷生成

将 4 套试卷拆分为 4 次独立请求，每次生成 1 套。

**优点**: 单次请求 token 量减半，超时风险大幅降低
**实现要点**:
- 分别调用 DeepSeek API 生成 paper-a/b/c/d
- 前端展示已完成的和待生成的
- 某套失败不影响其他套

### 方案 E: Token 预算控制

精确计算 prompt token 数，控制输入规模。

**优点**: 从源头控制延迟
**实现要点**:
- 使用 `tiktoken` 库估算 token 数
- 根据模型上下文窗口设置安全阈值（如 60K tokens）
- 超出时自动压缩或分批

## 推荐实施优先级

| 优先级 | 方案 | 复杂度 | 效果 | 适用场景 |
|--------|------|--------|------|----------|
| 1 | D: 分卷生成 | 低 | 高 | 当前 demo 升级首选 |
| 2 | A: 流式生成 | 中 | 高 | 用户体验改善 |
| 3 | E: Token 预算 | 低 | 中 | 预防性措施 |
| 4 | C: 任务队列 | 高 | 高 | 生产环境必备 |
| 5 | B: 分片上传 | 中 | 中 | 超大文件场景 |
