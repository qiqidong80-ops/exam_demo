from pydantic import BaseModel
from typing import Optional


class DifficultyConfig(BaseModel):
    easy: int = 60
    medium: int = 30
    hard: int = 10


class AnalyzeRequest(BaseModel):
    course: str
    scope: str = ""
    files: list[str]
    difficulty: DifficultyConfig = DifficultyConfig()


class KnowledgePoint(BaseModel):
    id: str
    name: str
    difficulty: str
    parent_topic: str = ""
    question_refs: list[str] = []


class GenerateRequest(BaseModel):
    course: str
    scope: str = ""
    knowledge_points: list[KnowledgePoint]
    difficulty: DifficultyConfig = DifficultyConfig()
    reference_texts: list[str] = []


class Question(BaseModel):
    type: str
    stem: str
    difficulty: str
    score: int
    answer: str
    analysis: str = ""


class Paper(BaseModel):
    id: str
    title: str
    questions: list[Question]


class TaskStatus(BaseModel):
    task_id: str
    status: str
    progress: str = ""
    result: Optional[dict] = None
    error: Optional[str] = None
