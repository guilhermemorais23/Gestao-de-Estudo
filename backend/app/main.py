from dotenv import load_dotenv

load_dotenv()

import os  # noqa: E402
from pathlib import Path  # noqa: E402

from fastapi import FastAPI, HTTPException  # noqa: E402
from fastapi.responses import FileResponse  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

from database.connection import Base, engine  # noqa: E402
from database.migracao import adicionar_colunas_novas  # noqa: E402
from models import tables  # noqa: E402,F401  (registra as tabelas)
from routes.auth_routes import router as auth_router  # noqa: E402
from routes.briefing_routes import publico as publico_router  # noqa: E402
from routes.briefing_routes import router as briefing_router  # noqa: E402
from routes.leads_routes import router as leads_router  # noqa: E402
from routes.publico_routes import router as previa_router  # noqa: E402

Base.metadata.create_all(bind=engine)
adicionar_colunas_novas(engine, Base)

app = FastAPI(title="Prospecta PB — API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ORIGENS_PERMITIDAS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["Autenticação"])
app.include_router(leads_router, prefix="/api/leads", tags=["Leads / Prospecção"])
app.include_router(briefing_router, prefix="/api/briefings", tags=["Briefings"])
app.include_router(publico_router, prefix="/api/publico", tags=["Público (cliente)"])
app.include_router(previa_router, prefix="/api/publico", tags=["Público (cliente)"])


@app.get("/api/saude")
def saude():
    return {"ok": True}


# Em produção, o próprio backend entrega o frontend já compilado (um serviço só para hospedar).
FRONTEND = Path(os.getenv("FRONTEND_DIST", Path(__file__).resolve().parents[2] / "frontend" / "dist"))
if FRONTEND.is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND / "assets"), name="assets")

    @app.get("/{caminho:path}", include_in_schema=False)
    def frontend(caminho: str):
        if caminho.startswith("api/"):
            raise HTTPException(status_code=404, detail="Rota não encontrada")
        arquivo = (FRONTEND / caminho).resolve()
        if caminho and arquivo.is_file() and FRONTEND.resolve() in arquivo.parents:
            return FileResponse(arquivo)
        return FileResponse(FRONTEND / "index.html")  # rotas do React (/leads, /p/..., /proposta/...)
