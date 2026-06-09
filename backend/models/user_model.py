from pydantic import BaseModel, EmailStr

class RegistroUsuario(BaseModel):
    name: str
    email: EmailStr
    senha: str

class LoginUsuario(BaseModel):
    email: EmailStr
    senha: str

class AtualizarUsuario(BaseModel):
    name: str
    email: EmailStr

class CriarEstudo(BaseModel):
    categoria_id: int
    tempo_minutos: int

class CriarCategoria(BaseModel):
    nome_categoria:str