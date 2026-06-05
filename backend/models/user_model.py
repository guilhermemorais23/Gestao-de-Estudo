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
    materia: str
    tempo_minutos: int