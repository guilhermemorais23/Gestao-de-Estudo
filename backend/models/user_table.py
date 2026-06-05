from sqlalchemy import Column, Integer, String
from database.connection import Base

class UserTable(Base):
    __tablename__ = "usuarios"

    id = Column(Integer,primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String,unique=True,index=True, nullable=False)
    senha = Column(String,nullable=False)