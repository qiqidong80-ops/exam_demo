import json
from database import SessionLocal
from models.kv import KVStore


def save(entity: str, key: str, value: dict) -> None:
    """写入或更新一条持久化数据"""
    db = SessionLocal()
    try:
        row = db.query(KVStore).filter_by(entity=entity, key=key).first()
        if row:
            row.value = value
        else:
            db.add(KVStore(entity=entity, key=key, value=value))
        db.commit()
    finally:
        db.close()


def delete(entity: str, key: str) -> None:
    """删除一条持久化数据"""
    db = SessionLocal()
    try:
        db.query(KVStore).filter_by(entity=entity, key=key).delete()
        db.commit()
    finally:
        db.close()


def load_all(entity: str) -> dict:
    """读取某个实体类型的全部数据 {key: value}"""
    db = SessionLocal()
    try:
        return {r.key: r.value for r in db.query(KVStore).filter_by(entity=entity).all()}
    finally:
        db.close()


def load_persisted() -> None:
    """启动时把落库数据载入内存 store（函数内懒导入，避免循环依赖）"""
    from api.store import papers_store
    from api.routes_class import classes_store
    from api.routes_exam import exams_store, submissions_store

    papers_store.update(load_all("paper"))
    classes_store.update(load_all("class"))
    exams_store.update(load_all("exam"))
    for k, v in load_all("submission").items():
        submissions_store[tuple(json.loads(k))] = v
