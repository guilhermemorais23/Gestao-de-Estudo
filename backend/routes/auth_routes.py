from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from models.user_model import RegistroUsuario, LoginUsuario, AtualizarUsuario,CriarEstudo
from models.user_table import UserTable, EstudoTable
from database.connection import get_db

# Nova importacaoo da pasta utils
from utils.hash import gerar_hash_senha, verificar_senha

#Roteador
router = APIRouter()

@router.post("/registro")
def register(user: RegistroUsuario, db: Session = Depends(get_db)):
    usuario_existente = db.query(UserTable).filter(UserTable.email == user.email).first()
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este e-mail já está cadastrado no sistema."
        )
    
    senha_criptografada = gerar_hash_senha(user.senha)
    
    novo_usuario = UserTable(
        name=user.name,
        email=user.email,
        senha=senha_criptografada
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    
    return {
        "message": "Usuário registrado com sucesso!",
        "user_id": novo_usuario.id,
        "email": novo_usuario.email
    }

@router.post("/login")
def login(user: LoginUsuario, db: Session = Depends(get_db)):
    usuario_banco = db.query(UserTable).filter(UserTable.email == user.email).first()
    if not usuario_banco:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos."
        )
    
    senha_correta = verificar_senha(user.senha, usuario_banco.senha)
    if not senha_correta:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos."
        )
    
    return {
        "message": "Login realizado com sucesso!",
        "user": {
            "id": usuario_banco.id,
            "name": usuario_banco.name,
            "email": usuario_banco.email
        }
    }

@router.put("/usuario/{usuario_id}")
def atualizar_usuario(usuario_id: int,dados: AtualizarUsuario, db: Session= Depends(get_db)):
    usuario = db.query(UserTable).filter(UserTable.id == usuario_id).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")

    usuario.nome = dados.name
    usuario.email= dados.email

    db.commit()
    db.refresh(usuario)

    return{
        "message": "Usuario atualizado com sucesso", "name":usuario.nome, "email": usuario.email
    }

@router.delete("/usuario/{usuario_id}")
def deletar_usuario(usuario_id: int, db:Session=Depends(get_db)):
    usuario = db.query(UserTable).filter(UserTable.id== usuario_id).first()

    if not usuario:
        raise HTTPException(status_code=404,detail= "usuario nao encontrdo")
    
    #comando pra apagar
    db.delete(usuario)
    db.commit()

    return {"message": "Usuário deletado com sucesso do sistema!"}

@router.post("/usuario/{usuario_id}/estudo")
def registrar_estudo(usuario_id: int, dados:CriarEstudo, db: Session=Depends(get_db)):
    novo_estudo = EstudoTable(
        usuario_id = usuario_id,
        materia = dados.materia,
        tempo_minutos = dados.tempo_minutos
    )

    db.add(novo_estudo)
    db.commit()
    db.refresh(novo_estudo)

    return{
        "message": "Sessao de estudo registrada com sucesso!",
        "materia": novo_estudo.materia,
        "tempo.minutos":novo_estudo.tempo_minutos,
        "data": novo_estudo.data
    }