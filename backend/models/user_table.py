from sqlalchemy import Column, Integer, String,ForeignKey, Date
from datetime import date
from database.connection import Base

class UserTable(Base):
    __tablename__ = "usuarios"

    id = Column(Integer,primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String,unique=True,index=True, nullable=False)
    senha = Column(String,nullable=False)

class EstudoTable(Base):
    __tablename__ = "estudos"

    id = Column(Integer, primary_key=True,index=True)

    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)

    materia = Column(String,nullable=False)
    tempo_minutos = Column(Integer,nullable=False)
    data = Column(Date, default=date.today)