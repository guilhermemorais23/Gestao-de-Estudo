from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

from database.connection import Base, engine  # noqa: E402
from models import tables  # noqa: E402,F401  (registra as tabelas)
from routes.auth_routes import router as auth_router  # noqa: E402
from routes.briefing_routes import publico as publico_router  # noqa: E402
from routes.briefing_routes import router as briefing_router  # noqa: E402
from routes.leads_routes import router as leads_router  # noqa: E402

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Prospecta PB — API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["Autenticação"])
app.include_router(leads_router, prefix="/api/leads", tags=["Leads / Prospecção"])
app.include_router(briefing_router, prefix="/api/briefings", tags=["Briefings"])
app.include_router(publico_router, prefix="/api/publico", tags=["Público (cliente)"])


@app.get("/api/saude")
def saude():
    return {"ok": True}
