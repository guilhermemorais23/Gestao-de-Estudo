"""Páginas que o cliente abre sem login: prévia do site e proposta."""
import json
import re
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.connection import get_db
from models.tables import BriefingTable, LeadTable, UserTable, agora
from services import previa_service as pv
from utils.jwt import usuario_do_token

router = APIRouter()


def _resolver(token: str, db: Session) -> tuple[UserTable, LeadTable | None, BriefingTable | None]:
    """O token pode ser de um lead (prévia automática) ou de uma resposta do questionário."""
    lead = db.query(LeadTable).filter_by(token=token).first()
    if lead:
        briefing = (
            db.query(BriefingTable).filter_by(lead_id=lead.id).order_by(BriefingTable.criado_em.desc()).first()
        )
        return lead.usuario, lead, briefing
    briefing = db.query(BriefingTable).filter_by(token=token).first()
    if briefing:
        lead = db.get(LeadTable, briefing.lead_id) if briefing.lead_id else None
        return db.get(UserTable, briefing.user_id), lead, briefing
    raise HTTPException(status_code=404, detail="Link inválido ou expirado")


def _e_o_dono(request: Request, user: UserTable) -> bool:
    """Quando você mesmo abre a prévia logado, não conta como visita do cliente."""
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        return False
    return usuario_do_token(auth[7:]) == user.id


def _vendedor(user: UserTable) -> dict:
    return {"nome": user.nome, "empresa": user.empresa, "whatsapp": user.whatsapp}


@router.get("/previa/{token}")
def previa(token: str, request: Request, db: Session = Depends(get_db)):
    user, lead, briefing = _resolver(token, db)
    respostas = json.loads(briefing.respostas) if briefing else {}
    detalhes = pv.carregar(lead.detalhes) if lead else None
    detalhes = detalhes or {}

    empresa = (briefing.empresa if briefing else None) or (lead.nome if lead else "")
    categoria = respostas.get("segmento") or (lead.categoria if lead else "")
    endereco = respostas.get("endereco") or (lead.endereco if lead else "")
    modelo = pv.detectar_modelo(categoria, lead.categoria if lead else "", empresa)

    textos = (
        (pv.carregar(briefing.textos) if briefing else None)
        or (pv.carregar(lead.previa_textos) if lead else None)
        or pv.textos_reserva(modelo, empresa, endereco, categoria)
    )
    if not (briefing and briefing.textos) and respostas.get("servicos"):
        # questionário sem textos de IA: usa os serviços que o dono escreveu
        textos["servicos"] = [{"nome": s.strip(), "descricao": ""} for s in respostas["servicos"].split("\n") if s.strip()]

    if lead and not _e_o_dono(request, user):
        momento = agora()
        lead.previa_vista_em = lead.previa_vista_em or momento
        lead.previa_ultima_vista_em = momento
        lead.previa_visualizacoes = (lead.previa_visualizacoes or 0) + 1
        db.commit()

    fotos = [
        {"url": f"/api/publico/foto/{token}/{i}", "autor": f.get("autor"), "autor_uri": f.get("autor_uri")}
        for i, f in enumerate(detalhes.get("fotos", []))
    ]
    return {
        "token": token,
        "modelo": modelo,
        "idioma": respostas.get("_idioma") or (lead.idioma if lead else "pt"),
        "empresa": empresa,
        "categoria": categoria,
        "bairro": pv.bairro_de(endereco),
        "endereco": endereco,
        "whatsapp": (briefing.contato_whatsapp if briefing else "") or (lead.whatsapp if lead else ""),
        "telefone": lead.telefone if lead else "",
        "avaliacao": lead.avaliacao if lead else None,
        "num_avaliacoes": lead.num_avaliacoes if lead else 0,
        "maps_url": detalhes.get("maps_url") or (lead.maps_url if lead else ""),
        "horarios": detalhes.get("horarios") or ([respostas["horario"]] if respostas.get("horario") else []),
        "fotos": fotos,
        "avaliacoes": detalhes.get("avaliacoes", []),
        "cores": respostas.get("cores", ""),
        "instagram": respostas.get("instagram", ""),
        "textos": textos,
        "vendedor": _vendedor(user),
    }


@router.get("/foto/{token}/{indice}")
def foto(token: str, indice: int, w: int = 1200, db: Session = Depends(get_db)):
    _, lead, _ = _resolver(token, db)
    fotos = (pv.carregar(lead.detalhes) or {}).get("fotos", []) if lead else []
    if not 0 <= indice < len(fotos):
        raise HTTPException(status_code=404, detail="Foto não encontrada")
    return RedirectResponse(pv.url_foto(fotos[indice]["nome"], max(200, min(w, 1600))), status_code=302)


def _txid(token: str) -> str:
    return re.sub(r"[^A-Za-z0-9]", "", token)[:25] or "***"


@router.get("/proposta/{token}")
def proposta(token: str, request: Request, db: Session = Depends(get_db)):
    user, lead, briefing = _resolver(token, db)
    pacotes = json.loads(user.pacotes or "[]")
    respostas = json.loads(briefing.respostas) if briefing else {}
    objetivo = (respostas.get("objetivo") or "").lower()
    recomendado = next((p["id"] for p in pacotes if p.get("recomendado")), pacotes[0]["id"] if pacotes else None)
    if "site completo" in objetivo or "full" in objetivo:
        recomendado = next((p["id"] for p in pacotes if p["id"] == "site"), recomendado)

    if lead and not lead.proposta_vista_em and not _e_o_dono(request, user):
        lead.proposta_vista_em = agora()
        db.commit()
    vista = lead.proposta_vista_em if lead else None
    return {
        "token": token,
        "empresa": (briefing.empresa if briefing else None) or (lead.nome if lead else ""),
        "contato": briefing.contato_nome if briefing else "",
        "vendedor": _vendedor(user),
        "pacotes": pacotes,
        "recomendado": recomendado,
        "escolha": lead.proposta_escolha if lead else None,
        "entrada_percentual": user.entrada_percentual if user.entrada_percentual is not None else 50,
        "pix": {"chave": user.pix_chave, "nome": user.pix_nome or user.nome, "cidade": user.pix_cidade or "JOAO PESSOA",
                "txid": _txid(token)} if user.pix_chave else None,
        "valida_ate": (vista + timedelta(days=7)).isoformat() if vista else None,
    }


class EscolhaIn(BaseModel):
    pacote: str


@router.post("/proposta/{token}/escolha")
def escolher(token: str, dados: EscolhaIn, request: Request, db: Session = Depends(get_db)):
    user, lead, _ = _resolver(token, db)
    if dados.pacote not in {p["id"] for p in json.loads(user.pacotes or "[]")}:
        raise HTTPException(status_code=400, detail="Pacote não encontrado")
    if lead and not _e_o_dono(request, user):
        lead.proposta_escolha = dados.pacote
        lead.proposta_escolha_em = agora()
        if lead.status not in ("fechado", "perdido"):
            lead.status = "proposta"
        db.commit()
    return {"ok": True}
