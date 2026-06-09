from sqlalchemy import Column, Integer, String,ForeignKey, Date
from sqlalchemy.orm import relationship
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
    categoria_id = Column(Integer,ForeignKey("categorias.id"))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)

    materia = Column(String,nullable=True)
    tempo_minutos = Column(Integer,nullable=False)
    data = Column(Date, default=date.today)

    categoria = relationship("CategoriaTable")

class CategoriaTable(Base):
    __tablename__ = "categorias"

    id = Column(Integer,primary_key=True,index=True)

    usuario_id = Column(Integer, index=True)
    nome_categoria = Column(String,nullable=False)

class MetaTable(Base):
    __tablename__ = "metas"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, index=True)
    categoria_id = Column(Integer, ForeignKey("categorias.id", ondelete="CASCADE")) # Apaga a meta se a categoria sumir
    tempo_objetivo_minutos = Column(Integer, nullable=False) # Ex: 1200 minutos (20 horas)
    tipo_meta = Column(String, default="semanal") # "diaria" ou "semanal"
    