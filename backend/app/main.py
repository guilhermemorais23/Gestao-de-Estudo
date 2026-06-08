from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.connection import engine, Base
from models.user_table import EstudoTable, UserTable



from routes.auth_routes import router as auth_router

# Cria as tabelas no banco de dados
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Minha API Profissional")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # ✨ Permite que o seu React acesse o Python
    allow_credentials=True,
    allow_methods=["*"], # Permite todos os métodos (POST, GET, PUT, DELETE)
    allow_headers=["*"], # Permite todos os cabeçalhos
)

app.include_router(auth_router, prefix="/auth", tags=["Autenticação"])