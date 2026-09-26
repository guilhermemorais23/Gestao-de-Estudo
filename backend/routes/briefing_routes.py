import json
import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from models.tables import BriefingTable, LeadTable, UserTable
from schemas.schemas import BriefingIn, BriefingOut, TextosIn
from services import ia_service
from utils.jwt import usuario_atual
from utils.telefone import so_digitos

router = APIRouter()      # rotas privadas (/api/briefings)
publico = APIRouter()     # rotas abertas para o cliente (/api/publico)


def _para_out(b: BriefingTable) -> BriefingOut:
    return BriefingOut(
        id=b.id, lead_id=b.lead_id, token=b.token, empresa=b.empresa or "", contato_nome=b.contato_nome or "",
        contato_whatsapp=b.contato_whatsapp or "", respostas=json.loads(b.respostas or "{}"), lido=b.lido,
        criado_em=b.criado_em, textos=json.loads(b.textos) if b.textos else None, textos_modelo=b.textos_modelo,
    )


@router.get("", response_model=list[BriefingOut])
def listar(user: UserTable = Depends(usuario_atual), db: Session = Depends(get_db)):
    itens = db.query(BriefingTable).filter_by(user_id=user.id).order_by(BriefingTable.criado_em.desc()).all()
    return [_para_out(b) for b in itens]


@router.post("/{briefing_id}/lido")
def marcar_lido(briefing_id: int, user: UserTable = Depends(usuario_atual), db: Session = Depends(get_db)):
    b = db.query(BriefingTable).filter_by(id=briefing_id, user_id=user.id).first()
    if b is None:
        raise HTTPException(status_code=404, detail="Não encontrado")
    b.lido = True
    db.commit()
    return {"ok": True}


def _meu_briefing(briefing_id: int, user: UserTable, db: Session) -> BriefingTable:
    b = db.query(BriefingTable).filter_by(id=briefing_id, user_id=user.id).first()
    if b is None:
        raise HTTPException(status_code=404, detail="Resposta não encontrada")
    return b


@router.get("/ia")
def info_ia(user: UserTable = Depends(usuario_atual)):
    return {
        "configurada": bool(os.getenv("ANTHROPIC_API_KEY")),
        "modelo": ia_service.modelo_configurado(),
        "modelos": ia_service.MODELOS_IA,
    }


@router.post("/{briefing_id}/gerar-textos", response_model=BriefingOut)
def gerar_textos(briefing_id: int, user: UserTable = Depends(usuario_atual), db: Session = Depends(get_db)):
    b = _meu_briefing(briefing_id, user, db)
    respostas = json.loads(b.respostas or "{}")
    textos, modelo = ia_service.gerar_textos_landing(respostas, respostas.get("_idioma", "pt"))
    b.textos = json.dumps(textos, ensure_ascii=False)
    b.textos_modelo = modelo
    db.commit()
    db.refresh(b)
    return _para_out(b)


@router.put("/{briefing_id}/textos", response_model=BriefingOut)
def salvar_textos(briefing_id: int, dados: TextosIn, user: UserTable = Depends(usuario_atual), db: Session = Depends(get_db)):
    b = _meu_briefing(briefing_id, user, db)
    b.textos = json.dumps(dados.model_dump(), ensure_ascii=False)
    db.commit()
    db.refresh(b)
    return _para_out(b)


def _resolver_token(token: str, db: Session) -> tuple[UserTable, LeadTable | None]:
    lead = db.query(LeadTable).filter_by(token=token).first()
    if lead:
        return lead.usuario, lead
    user = db.query(UserTable).filter_by(token_publico=token).first()
    if user:
        return user, None
    raise HTTPException(status_code=404, detail="Link inválido")


@publico.get("/q/{token}")
def dados_questionario(token: str, db: Session = Depends(get_db)):
    user, lead = _resolver_token(token, db)
    return {
        "vendedor": user.nome,
        "empresa_vendedor": user.empresa,
        "empresa_cliente": lead.nome if lead else "",
        "idioma": lead.idioma if lead else "pt",
    }


@publico.post("/q/{token}")
def responder_questionario(token: str, dados: BriefingIn, db: Session = Depends(get_db)):
    user, lead = _resolver_token(token, db)
    b = BriefingTable(
        user_id=user.id,
        lead_id=lead.id if lead else None,
        empresa=dados.empresa,
        contato_nome=dados.contato_nome,
        contato_whatsapp=so_digitos(dados.contato_whatsapp),
        respostas=json.dumps(dados.respostas, ensure_ascii=False),
    )
    db.add(b)
    if lead:
        if not lead.respondeu:
            lead.respondeu, lead.respondeu_no_passo = True, lead.passo or 1
        if lead.status in ("novo", "contatado", "respondeu"):
            lead.status = "questionario"
    db.commit()
    db.refresh(b)
    return {"token": b.token, "whatsapp_vendedor": user.whatsapp or ""}


@publico.get("/lp/{token}")
def dados_landing(token: str, db: Session = Depends(get_db)):
    b = db.query(BriefingTable).filter_by(token=token).first()
    if b is None:
        raise HTTPException(status_code=404, detail="Prévia não encontrada")
    user = db.get(UserTable, b.user_id)
    return {
        "briefing": _para_out(b),
        "vendedor": {"nome": user.nome, "empresa": user.empresa, "whatsapp": user.whatsapp},
    }
