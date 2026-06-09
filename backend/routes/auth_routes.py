from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime,date

from models.user_model import RegistroUsuario, LoginUsuario, AtualizarUsuario,CriarEstudo,CriarCategoria
from models.user_table import UserTable, EstudoTable, CategoriaTable
from database.connection import get_db

# Nova importacaoo da pasta utils
from utils.hash import gerar_hash_senha, verificar_senha

#Roteador
router = APIRouter()

@router.post("/registrar")
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
        categoria_id = dados.categoria_id,
        tempo_minutos = dados.tempo_minutos,
        data = date.today()
    )

    db.add(novo_estudo)
    db.commit()
    db.refresh(novo_estudo)

    return{
        "message": "Sessao de estudo registrada com sucesso!",
        "materia": novo_estudo.categoria.nome_categoria if novo_estudo.categoria else "sem categoria",
        "tempo_minutos":novo_estudo.tempo_minutos,
        "data": novo_estudo.data.strftime("%d/%m/%Y") if novo_estudo.data else None
    }

@router.get("/usuario/{usuario_id}/estudos")
def listar_estudos(usuario_id : int, db: Session = Depends(get_db)):
    estudos = db.query(EstudoTable).filter(EstudoTable.usuario_id ==usuario_id).all()
    return estudos

@router.delete("/usuario/{usuario_id}/estudos")
def apagar_Lista(usuario_id:int, db:Session = Depends(get_db)):
    linha_apagadas = db.query(EstudoTable).filter(EstudoTable.usuario_id==usuario_id).delete(synchronize_session=False)

    if not linha_apagadas:
        raise HTTPException (status_code=404,detail= "usuario nao encontrdo")
    
    db.commit()

    return{
        "message": "Historico de estudo deletado com sucesso!"
    }

@router.post("/usuario/{usuario_id}/categorias")
def cadastrar_categoria(usuario_id:int, dados:CriarCategoria,db:Session=Depends(get_db)):
    existe = db.query(CategoriaTable).filter(
        CategoriaTable.usuario_id == usuario_id,
        CategoriaTable.nome_categoria == dados.nome_categoria
    ).first()


    if existe:
        raise HTTPException(status_code=400, detail="Voce ja cadastrou essa categoria")
    
    nova_categoria = CategoriaTable(
        usuario_id = usuario_id,
        nome_categoria = dados.nome_categoria
    )

    db.add(nova_categoria)
    db.commit()
    db.refresh(nova_categoria)

    return {"message": "Categoria criada com sucesso","categoria": nova_categoria}

@router.get("/usuario/{usuario_id}/categorias")
def listar_categorias(usuario_id: int, db: Session = Depends(get_db)):
    categorias = db.query(CategoriaTable).filter(CategoriaTable.usuario_id == usuario_id).all()
    return categorias