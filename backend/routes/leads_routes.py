from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from database.connection import get_db
from models.tables import LeadTable, UserTable
from schemas.schemas import BuscaIn, LeadManualIn, LeadOut, LeadUpdate
from services import prospeccao_service
from utils.jwt import usuario_atual
from utils.telefone import provavel_celular, so_digitos, telefone_whatsapp

router = APIRouter()


@router.post("/buscar")
def buscar(dados: BuscaIn, user: UserTable = Depends(usuario_atual), db: Session = Depends(get_db)):
    encontrados, total = prospeccao_service.buscar(
        dados.termo, dados.cidade, dados.fonte, dados.idioma, dados.regiao, dados.paginas,
        dados.incluir_so_rede_social,
    )
    novos = 0
    ids = []
    for info in encontrados:
        lead = db.query(LeadTable).filter_by(user_id=user.id, place_id=info["place_id"]).first()
        if lead is None:
            lead = LeadTable(user_id=user.id, **info)
            db.add(lead)
            novos += 1
        else:  # atualiza dados públicos, mas preserva status/notas
            for campo in ("telefone", "website", "so_rede_social", "avaliacao", "num_avaliacoes", "score"):
                setattr(lead, campo, info[campo])
        db.flush()
        ids.append(lead.id)
    db.commit()
    leads = db.query(LeadTable).filter(LeadTable.id.in_(ids)).order_by(LeadTable.score.desc()).all()
    return {
        "total_encontrado": total,
        "sem_site": len(encontrados),
        "novos": novos,
        "leads": [LeadOut.model_validate(l) for l in leads],
    }


@router.get("", response_model=list[LeadOut])
def listar(
    status: str | None = None,
    regiao: str | None = None,
    q: str | None = None,
    user: UserTable = Depends(usuario_atual),
    db: Session = Depends(get_db),
):
    consulta = db.query(LeadTable).filter(LeadTable.user_id == user.id)
    if status:
        consulta = consulta.filter(LeadTable.status == status)
    if regiao:
        consulta = consulta.filter(LeadTable.regiao == regiao)
    if q:
        like = f"%{q}%"
        consulta = consulta.filter(
            LeadTable.nome.ilike(like) | LeadTable.categoria.ilike(like) | LeadTable.endereco.ilike(like)
        )
    return consulta.order_by(LeadTable.score.desc(), LeadTable.criado_em.desc()).limit(500).all()


@router.get("/resumo")
def resumo(user: UserTable = Depends(usuario_atual), db: Session = Depends(get_db)):
    linhas = (
        db.query(LeadTable.status, func.count(LeadTable.id))
        .filter(LeadTable.user_id == user.id)
        .group_by(LeadTable.status)
        .all()
    )
    return {status: qtd for status, qtd in linhas}


@router.post("", response_model=LeadOut)
def criar_manual(dados: LeadManualIn, user: UserTable = Depends(usuario_atual), db: Session = Depends(get_db)):
    wa = telefone_whatsapp(None, dados.telefone)
    lead = LeadTable(
        user_id=user.id,
        place_id=f"manual:{so_digitos(dados.telefone) or dados.nome}",
        fonte="manual",
        nome=dados.nome,
        telefone=dados.telefone,
        whatsapp=wa,
        whatsapp_provavel=provavel_celular(wa) if wa else False,
        cidade=dados.cidade,
        categoria=dados.categoria,
        regiao=dados.regiao,
        idioma=dados.idioma,
        score=50,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


def _meu_lead(lead_id: int, user: UserTable, db: Session) -> LeadTable:
    lead = db.query(LeadTable).filter_by(id=lead_id, user_id=user.id).first()
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead não encontrado")
    return lead


@router.patch("/{lead_id}", response_model=LeadOut)
def atualizar(lead_id: int, dados: LeadUpdate, user: UserTable = Depends(usuario_atual), db: Session = Depends(get_db)):
    lead = _meu_lead(lead_id, user, db)
    for campo, valor in dados.model_dump(exclude_none=True).items():
        if campo == "whatsapp":
            valor = so_digitos(valor)
            lead.whatsapp_provavel = provavel_celular(valor) if valor else False
        setattr(lead, campo, valor)
    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/{lead_id}")
def excluir(lead_id: int, user: UserTable = Depends(usuario_atual), db: Session = Depends(get_db)):
    lead = _meu_lead(lead_id, user, db)
    for b in lead.briefings:
        b.lead_id = None
    db.delete(lead)
    db.commit()
    return {"ok": True}
