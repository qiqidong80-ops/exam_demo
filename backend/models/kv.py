from sqlalchemy import Column, String, JSON
from database import Base


class KVStore(Base):
    """通用键值存储：持久化试卷/班级/考试/提交记录等内存数据"""
    __tablename__ = "kv_store"

    entity = Column(String, primary_key=True)  # paper | class | exam | submission
    key = Column(String, primary_key=True)     # 各实体内部的唯一标识（字符串）
    value = Column(JSON, nullable=False)       # 序列化后的完整数据
