from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class AntiCheatConfig(BaseModel):
    shuffle_questions: bool = True
    tab_switch_detection: bool = True


class ExamCreate(BaseModel):
    name: str
    paper_id: str
    exam_time: str  # ISO datetime string
    duration_minutes: int
    class_ids: list[str] = []
    anti_cheat: AntiCheatConfig = AntiCheatConfig()


class Exam(BaseModel):
    id: str
    name: str
    paper_title: str = ""
    exam_code: str
    exam_time: str
    duration_minutes: int
    class_ids: list[str] = []
    classes: list[str] = []  # 展示用班级名
    anti_cheat: AntiCheatConfig = AntiCheatConfig()
    status: str = "pending"  # pending | active | finished
    created_at: str = ""


class AnswerItem(BaseModel):
    question_id: str
    selected_option: str


class SubmitRequest(BaseModel):
    answers: list[AnswerItem] = []
