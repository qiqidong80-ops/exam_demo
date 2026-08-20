import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from models.class_schemas import ClassCreate, ClassImport
from api.persistence import save, delete

class_router = APIRouter()

classes_store: dict[str, dict] = {}


@class_router.post("")
async def create_class(req: ClassCreate):
    name = req.name.strip()
    if not name:
        raise HTTPException(400, "班级名称不能为空")
    if any(c["name"] == name for c in classes_store.values()):
        raise HTTPException(400, "班级已存在")
    cid = str(uuid.uuid4())
    cls = {
        "id": cid,
        "name": name,
        "students": [],
        "created_at": datetime.now().isoformat(),
    }
    classes_store[cid] = cls
    save("class", cid, cls)
    return cls


@class_router.get("")
async def list_classes():
    return list(classes_store.values())


@class_router.get("/{class_id}")
async def get_class(class_id: str):
    c = classes_store.get(class_id)
    if not c:
        raise HTTPException(404, "班级不存在")
    return c


@class_router.post("/{class_id}/students")
async def import_students(class_id: str, req: ClassImport):
    c = classes_store.get(class_id)
    if not c:
        raise HTTPException(404, "班级不存在")
    names = [s.strip() for s in req.students if s.strip()]
    seen = set(c["students"])
    added = []
    for n in names:
        if n not in seen:
            seen.add(n)
            added.append(n)
    c["students"].extend(added)
    save("class", class_id, c)
    return {"students": c["students"], "added": len(added)}


@class_router.delete("/{class_id}")
async def delete_class(class_id: str):
    if class_id not in classes_store:
        raise HTTPException(404, "班级不存在")
    del classes_store[class_id]
    delete("class", class_id)
    return {"message": "已删除"}
