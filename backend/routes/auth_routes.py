import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from models.tables import UserTable
from schemas.schemas import ConfigIn, LoginIn, RegistroIn, UsuarioOut
from utils.hash import gerar_hash_senha, verificar_senha
from utils.jwt import criar_token, usuario_atual
from utils.telefone import telefone_whatsapp

router = APIRouter()


@router.post("/registro")
def registro(dados: RegistroIn, db: Session = Depends(get_db)):
    ja_tem_usuario = db.query(UserTable).count() > 0
    if ja_tem_usuario and os.getenv("PERMITIR_CADASTRO", "0") != "1":
        raise HTTPException(status_code=403, detail="Cadastro fechado. Peça acesso ao administrador.")
    if db.query(UserTable).filter(UserTable.email == dados.email.lower()).first():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")
    user = UserTable(nome=dados.nome, email=dados.email.lower(), senha_hash=gerar_hash_senha(dados.senha))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": criar_token(user.id), "usuario": UsuarioOut.model_validate(user)}


@router.post("/login")
def login(dados: LoginIn, db: Session = Depends(get_db)):
    user = db.query(UserTable).filter(UserTable.email == dados.email.lower()).first()
    if not user or not verificar_senha(dados.senha, user.senha_hash):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    return {"token": criar_token(user.id), "usuario": UsuarioOut.model_validate(user)}


@router.get("/eu", response_model=UsuarioOut)
def eu(user: UserTable = Depends(usuario_atual)):
    return user


@router.put("/config", response_model=UsuarioOut)
def salvar_config(dados: ConfigIn, user: UserTable = Depends(usuario_atual), db: Session = Depends(get_db)):
    for campo, valor in dados.model_dump(exclude_none=True).items():
        if campo == "whatsapp":
            valor = telefone_whatsapp(None, valor)
        setattr(user, campo, valor)
    db.commit()
    db.refresh(user)
    return user
