from pydantic import BaseModel
from typing import Literal


class RegisterRequest(BaseModel):
    username: str
    password: str
    role: Literal["teacher", "student"] = "student"


class LoginRequest(BaseModel):
    username: str
    password: str


class UserInfo(BaseModel):
    username: str
    role: str


class TokenResponse(BaseModel):
    token: str
    user: UserInfo
