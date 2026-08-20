from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.router import router
from api.routes_auth import auth_router
from api.persistence import load_persisted
from database import init_db

app = FastAPI(title="AI 命题系统 Demo")

init_db()
load_persisted()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
