import uuid
import json
import random
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from models.exam_schemas import ExamCreate, Exam, SubmitRequest
from models.user import User
from api.routes_class import classes_store
from api.store import papers_store
from api.persistence import save, delete
from security import get_current_user, require_teacher, require_student

exam_router = APIRouter()

exams_store: dict[str, dict] = {}
# 提交记录: (exam_code, username) -> {score, total, correct_count, total_count}
submissions_store: dict[tuple[str, str], dict] = {}


def _generate_exam_code() -> str:
    while True:
        code = str(random.randint(100000, 999999))
        if not any(e["exam_code"] == code for e in exams_store.values()):
            return code


def compute_status(exam: dict) -> str:
    try:
        start = datetime.fromisoformat(exam["exam_time"])
    except (ValueError, TypeError):
        return "pending"
    end = start + timedelta(minutes=exam.get("duration_minutes", 0))
    now = datetime.now()
    if now < start:
        return "pending"
    if now > end:
        return "finished"
    return "active"


def _resolve_class_names(class_ids: list[str]) -> list[str]:
    return [classes_store[cid]["name"] for cid in class_ids if cid in classes_store]


def _participant_count(class_ids: list[str]) -> int:
    return sum(len(classes_store[cid]["students"]) for cid in class_ids if cid in classes_store)


def _find_exam_by_code(code: str):
    return next((e for e in exams_store.values() if e["exam_code"] == code), None)


def _norm_letter(s: str) -> str:
    s = (s or "").strip().upper()
    for ch in s:
        if ch in "ABCD":
            return ch
    return s


def _norm_text(s: str) -> str:
    s = (s or "").strip()
    s = s.replace("，", ",").replace(" ", "").replace("　", "")
    return s.lower()


@exam_router.post("", dependencies=[Depends(require_teacher)])
async def create_exam(req: ExamCreate):
    """创建考试，自动生成 6 位考试码"""
    if not req.name.strip():
        raise HTTPException(400, "考试名称不能为空")
    exam_id = str(uuid.uuid4())
    code = _generate_exam_code()
    paper = papers_store.get(req.paper_id, {})
    exam = {
        "id": exam_id,
        "name": req.name.strip(),
        "paper_id": req.paper_id,
        "paper_title": paper.get("title", ""),
        "exam_code": code,
        "exam_time": req.exam_time,
        "duration_minutes": req.duration_minutes,
        "class_ids": req.class_ids,
        "classes": _resolve_class_names(req.class_ids),
        "anti_cheat": req.anti_cheat.model_dump(),
        "status": "pending",
        "created_at": datetime.now().isoformat(),
    }
    exams_store[exam_id] = exam
    save("exam", exam_id, exam)
    return exam


@exam_router.get("", dependencies=[Depends(require_teacher)])
async def list_exams(status: str | None = None):
    """获取考试列表（含动态状态），可按 status 过滤"""
    result = []
    for e in exams_store.values():
        e = dict(e)
        e["status"] = compute_status(e)
        e["participant_count"] = _participant_count(e.get("class_ids", []))
        if status is None or e["status"] == status:
            result.append(e)
    return result


@exam_router.get("/validate", dependencies=[Depends(require_student)])
async def validate_exam(code: str, current_user: User = Depends(get_current_user)):
    """验证考试码是否有效，返回考试基本信息"""
    exam = _find_exam_by_code(code)
    if not exam:
        return {"valid": False}
    status = compute_status(exam)
    if status == "pending":
        return {"valid": False, "reason": "pending"}
    if status == "finished":
        return {"valid": False, "reason": "finished"}
    paper = papers_store.get(exam.get("paper_id", ""))
    question_count = len(paper.get("questions", [])) if paper else 0
    submitted = (code, current_user.username) in submissions_store
    return {
        "valid": True,
        "submitted": submitted,
        "exam": {
            "id": exam["id"],
            "name": exam["name"],
            "duration": exam.get("duration_minutes", 0),
            "question_count": question_count,
        },
    }


@exam_router.get("/{exam_id}", dependencies=[Depends(require_teacher)])
async def get_exam(exam_id: str):
    """获取单个考试详情"""
    e = exams_store.get(exam_id)
    if not e:
        raise HTTPException(404, "考试不存在")
    e = dict(e)
    e["status"] = compute_status(e)
    return e


@exam_router.get("/{exam_id}/report", dependencies=[Depends(require_teacher)])
async def get_exam_report(exam_id: str):
    """获取考试成绩统计报告（已结束考试自动生成模拟成绩）"""
    e = exams_store.get(exam_id)
    if not e:
        raise HTTPException(404, "考试不存在")
    if compute_status(e) != "finished":
        raise HTTPException(400, "考试尚未结束，暂无成绩")
    from services.report import build_report
    return build_report(e)


@exam_router.delete("/{exam_id}", dependencies=[Depends(require_teacher)])
async def delete_exam(exam_id: str):
    """删除考试"""
    if exam_id not in exams_store:
        raise HTTPException(404, "考试不存在")
    del exams_store[exam_id]
    delete("exam", exam_id)
    return {"message": "已删除"}


@exam_router.get("/{exam_code}/paper", dependencies=[Depends(require_student)])
async def get_paper(exam_code: str):
    """获取试卷内容（学生答题用，不含答案）"""
    exam = _find_exam_by_code(exam_code)
    if not exam:
        raise HTTPException(404, "考试不存在")
    if compute_status(exam) != "active":
        raise HTTPException(400, "考试不在进行中")
    paper = papers_store.get(exam.get("paper_id", ""))
    if not paper:
        raise HTTPException(404, "试卷不存在")
    questions = []
    for i, q in enumerate(paper.get("questions", [])):
        qtype = q.get("type", "")
        questions.append({
            "id": f"q{i}",
            "type": qtype,
            "content": q.get("stem", ""),
            "options": ["A", "B", "C", "D"] if "选择" in qtype else [],
        })
    return {"questions": questions}


@exam_router.post("/{exam_code}/submit", dependencies=[Depends(require_student)])
async def submit_exam(exam_code: str, req: SubmitRequest, current_user: User = Depends(get_current_user)):
    """提交答卷，判分（客观题自动判分，主观题留待教师阅卷）"""
    exam = _find_exam_by_code(exam_code)
    if not exam:
        raise HTTPException(404, "考试不存在")
    if compute_status(exam) != "active":
        raise HTTPException(400, "考试不在进行中，无法提交")
    key = (exam_code, current_user.username)
    if key in submissions_store:
        raise HTTPException(400, "该考试已提交过，不能重复提交")
    paper = papers_store.get(exam.get("paper_id", ""))
    if not paper:
        raise HTTPException(404, "试卷不存在")
    questions = paper.get("questions", [])
    answer_map = {a.question_id: a.selected_option for a in req.answers}
    correct_count = 0
    score = 0
    total = 0
    for i, q in enumerate(questions):
        total += q.get("score", 0)
        selected = answer_map.get(f"q{i}")
        if selected is None or not str(selected).strip():
            continue
        qtype = q.get("type", "")
        q_ans = q.get("answer", "")
        if "选择" in qtype:
            if _norm_letter(selected) == _norm_letter(q_ans):
                correct_count += 1
                score += q.get("score", 0)
        elif "填空" in qtype:
            if _norm_text(selected) == _norm_text(q_ans):
                correct_count += 1
                score += q.get("score", 0)
        # 计算/证明等主观题不自动判分，由教师人工阅卷
    result = {
        "score": score,
        "total": total,
        "correct_count": correct_count,
        "total_count": len(questions),
    }
    submissions_store[key] = result
    save("submission", json.dumps([exam_code, current_user.username]), result)
    return result
