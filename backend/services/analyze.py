import json
import httpx
from config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL
from services.parse import parse_file

MAX_CHARS = 60000


def smart_truncate(text: str, max_chars: int = MAX_CHARS) -> str:
    """当文本超过限制时，保留开头、结尾和中间采样，避免丢失尾部内容。"""
    if len(text) <= max_chars:
        return text
    head_size = max_chars // 3
    tail_size = max_chars // 3
    mid_size = max_chars - head_size - tail_size
    mid_start = (len(text) - mid_size) // 2
    return text[:head_size] + "\n\n... [中间内容省略] ...\n\n" + text[mid_start:mid_start + mid_size] + "\n\n... [中间内容省略] ...\n\n" + text[-tail_size:]

SYSTEM_PROMPT = """你是一位资深命题专家。请分析以下试卷内容，提取所有知识点。

返回严格 JSON 格式（不要 markdown 代码块）:
{
  "knowledge_points": [
    {"name": "知识点名称", "difficulty": "easy|medium|hard", "parent_topic": "所属章节", "question_refs": ["题号引用"]}
  ]
}

要求:
1. 知识点粒度适中（不要太细，如"加法"和"减法"可合并为"四则运算"）
2. difficulty 根据题目实际难度判断
3. parent_topic 为该知识点所属的大章节/主题
4. 去重合并相同知识点
"""


async def run_analysis(course: str, scope: str, file_paths: list[str], difficulty: dict) -> list[dict]:
    # 解析所有文件
    all_text_parts = []
    for fp in file_paths:
        text = parse_file(fp)
        all_text_parts.append(f"=== {fp} ===\n{text}")
    combined_text = "\n\n".join(all_text_parts)

    # 调用 DeepSeek API（大文件可能需要更长时间）
    async with httpx.AsyncClient(timeout=300) as client:
        resp = await client.post(
            f"{DEEPSEEK_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}"},
            json={
                "model": DEEPSEEK_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"课程: {course}\n范围: {scope or '全部'}\n\n试卷内容:\n{smart_truncate(combined_text)}"}
                ],
                "temperature": 0.3,
            }
        )
        resp.raise_for_status()
        data = resp.json()

    # 解析 AI 返回的 JSON
    content = data["choices"][0]["message"]["content"]
    content = content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1].rsplit("\n", 1)[0]
    parsed = json.loads(content)
    kps = parsed.get("knowledge_points", [])

    # 添加 id
    for i, kp in enumerate(kps):
        kp["id"] = f"kp-{i+1}"
        kp.setdefault("parent_topic", "")
        kp.setdefault("question_refs", [])

    return kps
