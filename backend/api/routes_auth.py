from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.auth_schemas import LoginRequest, RegisterRequest
from models.user import User
from security import create_access_token, get_current_user, hash_password, verify_password

auth_router = APIRouter()


@auth_router.post("/register")
async def register(req: RegisterRequest, db: Session = Depends(get_db)):
    username = req.username.strip()
    if not username or not req.password:
        raise HTTPException(status_code=400, detail="用户名和密码不能为空")
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=400, detail="用户名已存在")
    user = User(
        username=username,
        password_hash=hash_password(req.password),
        role=req.role,
    )
    db.add(user)
    db.commit()
    return {"success": True, "message": "注册成功"}


@auth_router.post("/login")
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username.strip()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    token = create_access_token(user.username)
    return {"token": token, "user": {"username": user.username, "role": user.role}}


@auth_router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {"username": current_user.username, "role": current_user.role}
