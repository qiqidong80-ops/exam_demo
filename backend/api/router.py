import os
import shutil
import asyncio
import uuid
from fastapi import APIRouter, UploadFile, File, Query, HTTPException, Depends
from fastapi.responses import Response
from models.schemas import AnalyzeRequest, GenerateRequest, TaskStatus
from api.routes_exam import exam_router
from api.routes_class import class_router
from api.store import papers_store
from api.persistence import save
from security import get_current_user, require_teacher

router = APIRouter(dependencies=[Depends(get_current_user)])

# 注册考试子路由（内部按端点区分教师/学生角色）
router.include_router(exam_router, prefix="/exams", tags=["exams"], dependencies=[Depends(get_current_user)])

# 注册班级子路由（仅教师）
router.include_router(class_router, prefix="/classes", tags=["classes"], dependencies=[Depends(require_teacher)])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_UPLOAD_EXTENSIONS = {".pdf", ".docx", ".doc"}

# 内存任务存储
tasks: dict[str, dict] = {}

# --- POST /upload ---
@router.post("/upload", dependencies=[Depends(require_teacher)])
async def upload_files(files: list[UploadFile] = File(...)):
    result = []
    for f in files:
        ext = os.path.splitext(f.filename or "")[1].lower()
        if ext not in ALLOWED_UPLOAD_EXTENSIONS:
            raise HTTPException(400, f"不支持的文件格式: {ext or '未知'}，仅支持 PDF/Word")
        path = os.path.join(UPLOAD_DIR, f.filename)
        with open(path, "wb") as buf:
            shutil.copyfileobj(f.file, buf)
        result.append({"filename": f.filename, "size": os.path.getsize(path)})
    return {"files": result}

# --- POST /analyze ---
@router.post("/analyze", dependencies=[Depends(require_teacher)])
async def analyze(req: AnalyzeRequest):
    from services.analyze import run_analysis
    task_id = str(uuid.uuid4())
    tasks[task_id] = {"status": "processing", "progress": "正在解析试卷...", "result": None, "error": None}

    async def run():
        try:
            full_paths = [os.path.join(UPLOAD_DIR, f) if not os.path.isabs(f) else f for f in req.files]
            kps = await run_analysis(req.course, req.scope, full_paths, req.difficulty.model_dump())
            tasks[task_id] = {"status": "completed", "progress": "", "result": {"knowledge_points": kps}, "error": None}
        except Exception as e:
            tasks[task_id] = {"status": "failed", "progress": "", "result": None, "error": str(e)}

    asyncio.create_task(run())
    return {"task_id": task_id, "status": "processing"}

# --- GET /task/{task_id} ---
@router.get("/task/{task_id}", dependencies=[Depends(require_teacher)])
async def get_task(task_id: str):
    t = tasks.get(task_id)
    if not t:
        raise HTTPException(404, "任务不存在")
    return TaskStatus(task_id=task_id, **t)

# --- POST /generate ---
@router.post("/generate", dependencies=[Depends(require_teacher)])
async def generate(req: GenerateRequest):
    from services.generate import run_generation
    task_id = str(uuid.uuid4())
    tasks[task_id] = {"status": "processing", "progress": "正在生成试卷...", "result": None, "error": None}

    async def run():
        try:
            tasks[task_id] = {"status": "processing", "progress": "正在准备生成参数...", "result": None, "error": None}
            kps_dicts = [kp.model_dump() for kp in req.knowledge_points]
            tasks[task_id] = {"status": "processing", "progress": "正在调用 AI 生成试卷（预计 2-5 分钟）...", "result": None, "error": None}
            papers = await run_generation(req.course, req.scope, kps_dicts, req.difficulty.model_dump(), req.reference_texts)
            tasks[task_id] = {"status": "processing", "progress": "正在处理生成结果...", "result": None, "error": None}
            for paper in papers:
                papers_store[paper["id"]] = paper
                save("paper", paper["id"], paper)
            tasks[task_id] = {"status": "completed", "progress": "", "result": {"papers": papers}, "error": None}
        except Exception as e:
            tasks[task_id] = {"status": "failed", "progress": "", "result": None, "error": str(e)}

    asyncio.create_task(run())
    return {"task_id": task_id, "status": "processing"}

# --- GET /papers ---
@router.get("/papers", dependencies=[Depends(require_teacher)])
async def list_papers():
    """返回已生成试卷列表（仅 id + title，供考试发布页选择）"""
    return [{"id": pid, "title": p["title"]} for pid, p in papers_store.items()]

# --- GET /papers/{paper_id}/download ---
@router.get("/papers/{paper_id}/download", dependencies=[Depends(require_teacher)])
async def download_paper(paper_id: str, format: str = Query("pdf")):
    from services.generate import export_pdf, export_docx
    paper = papers_store.get(paper_id)
    if not paper:
        raise HTTPException(404, "试卷不存在")
    if format == "docx":
        data = export_docx(paper)
        return Response(
            data,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename={paper_id}.docx"}
        )
    data = export_pdf(paper)
    return Response(
        data,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={paper_id}.pdf"}
    )
