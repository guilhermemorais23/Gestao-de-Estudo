import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from database.connection import get_db
from models.tables import UserTable

SECRET_KEY = os.getenv("SECRET_KEY", "dev-chave-local-troque-no-arquivo-env-0123456789")
ALGORITMO = "HS256"
EXPIRA_HORAS = 24 * 7

bearer = HTTPBearer(auto_error=False)


def criar_token(user_id: int) -> str:
    payload = {"sub": str(user_id), "exp": datetime.now(timezone.utc) + timedelta(hours=EXPIRA_HORAS)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITMO)


def usuario_atual(
    cred: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> UserTable:
    if cred is None:
        raise HTTPException(status_code=401, detail="Faça login")
    try:
        payload = jwt.decode(cred.credentials, SECRET_KEY, algorithms=[ALGORITMO])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Sessão expirada, faça login de novo")
    user = db.get(UserTable, int(payload["sub"]))
    if user is None:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    return user
