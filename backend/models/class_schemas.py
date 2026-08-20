from pydantic import BaseModel
from typing import Optional


class ClassCreate(BaseModel):
    name: str


class ClassImport(BaseModel):
    students: list[str] = []


class ClassInfo(BaseModel):
    id: str
    name: str
    students: list[str] = []
    created_at: str = ""
