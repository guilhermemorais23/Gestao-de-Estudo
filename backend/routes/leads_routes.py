import json
import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from database.connection import get_db
from models.tables import BriefingTable, LeadTable, UserTable
from schemas.schemas import BuscaIn, EnvioIn, LeadManualIn, LeadOut, LeadUpdate
from services import ia_service, previa_service, prospeccao_service
from utils.jwt import usuario_atual
from utils.telefone import provavel_celular, so_digitos, telefone_whatsapp

router = APIRouter()

# Dias sem resposta até sugerir o próximo retorno
DIAS_RETORNO1 = 2
DIAS_RETORNO2 = 4
# Depois da prévia: retornos no 1º, 3º e 7º dia (contados a partir do envio anterior)
DIAS_POS = {0: 1, 1: 2, 2: 4}
NUM_PASSO = {"abertura": 1, "retorno1": 2, "retorno2": 3}
ENCERRADOS = ("fechado", "perdido")


def _agora():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _pendentes(consulta):
    """Leads sem resposta que já passaram do prazo do próximo retorno."""
    agora = _agora()
    antes_da_resposta = LeadTable.respondeu.is_(False) & (
        ((LeadTable.passo == 1) & (LeadTable.ultimo_envio_em <= agora - timedelta(days=DIAS_RETORNO1)))
        | ((LeadTable.passo == 2) & (LeadTable.ultimo_envio_em <= agora - timedelta(days=DIAS_RETORNO2)))
    )
    pos_previa = (
        LeadTable.previa_enviada_em.isnot(None)
        & LeadTable.proposta_escolha.is_(None)
        & or_(*[
            (func.coalesce(LeadTable.pos_passo, 0) == etapa) & (LeadTable.ultimo_envio_em <= agora - timedelta(days=dias))
            for etapa, dias in DIAS_POS.items()
        ])
    )
    return consulta.filter(LeadTable.status.notin_(ENCERRADOS), antes_da_resposta | pos_previa)


def _hoje_brasilia() -> str:
    return (datetime.now(timezone.utc) - timedelta(hours=3)).strftime("%Y-%m-%d")


def envios_hoje(user: UserTable) -> int:
    return (user.envios_hoje or 0) if user.envios_data == _hoje_brasilia() else 0


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
    pendentes: bool = False,
    user: UserTable = Depends(usuario_atual),
    db: Session = Depends(get_db),
):
    consulta = db.query(LeadTable).filter(LeadTable.user_id == user.id)
    if pendentes:
        consulta = _pendentes(consulta)
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
    resultado = {status: qtd for status, qtd in linhas}
    resultado["_envios_hoje"] = envios_hoje(user)
    resultado["_limite_diario"] = user.limite_diario or 20
    resultado["_pendentes"] = _pendentes(db.query(LeadTable).filter(LeadTable.user_id == user.id)).count()
    inicio_mes = _agora().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    resultado["_fechados_mes"] = (
        db.query(LeadTable)
        .filter(LeadTable.user_id == user.id, LeadTable.status == "fechado", LeadTable.atualizado_em >= inicio_mes)
        .count()
    )
    return resultado


@router.get("/metricas")
def metricas(user: UserTable = Depends(usuario_atual), db: Session = Depends(get_db)):
    """Funil por tom de mensagem: quantos receberam, responderam, fizeram o questionário e fecharam."""
    leads = db.query(LeadTable).filter(LeadTable.user_id == user.id, LeadTable.passo > 0).all()
    com_briefing = {
        lead_id for (lead_id,) in db.query(BriefingTable.lead_id).filter(
            BriefingTable.user_id == user.id, BriefingTable.lead_id.isnot(None)
        )
    }

    def funil(grupo):
        return {
            "contatados": len(grupo),
            "responderam": sum(l.respondeu for l in grupo),
            "respondeu_no_passo": {str(p): sum(l.respondeu_no_passo == p for l in grupo) for p in (1, 2, 3)},
            "questionario_enviado": sum(l.questionario_enviado for l in grupo),
            "questionario_respondido": sum(l.id in com_briefing for l in grupo),
            "proposta": sum(l.status in ("proposta", "fechado") for l in grupo),
            "fechados": sum(l.status == "fechado" for l in grupo),
            "previa_enviada": sum(l.previa_enviada_em is not None for l in grupo),
            "previa_aberta": sum(l.previa_vista_em is not None for l in grupo),
            "proposta_vista": sum(l.proposta_vista_em is not None or l.proposta_escolha is not None for l in grupo),
            "parou_sem_resposta": {
                str(p): sum((not l.respondeu) and l.passo == p for l in grupo) for p in (1, 2, 3)
            },
        }

    return {
        "geral": funil(leads),
        "formal": funil([l for l in leads if l.tom == "formal"]),
        "descontraido": funil([l for l in leads if l.tom == "descontraido"]),
    }


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


@router.get("/atividade")
def atividade(user: UserTable = Depends(usuario_atual), db: Session = Depends(get_db)):
    """O que os clientes fizeram nos últimos 7 dias: abriram a prévia, viram a proposta, escolheram pacote."""
    desde = _agora() - timedelta(days=7)
    leads = (
        db.query(LeadTable)
        .filter(
            LeadTable.user_id == user.id,
            (LeadTable.previa_ultima_vista_em >= desde)
            | (LeadTable.proposta_vista_em >= desde)
            | (LeadTable.proposta_escolha_em >= desde),
        )
        .all()
    )
    eventos = []
    for l in leads:
        if l.proposta_escolha_em and l.proposta_escolha_em >= desde:
            eventos.append({"tipo": "escolha", "quando": l.proposta_escolha_em, "detalhe": l.proposta_escolha})
        elif l.proposta_vista_em and l.proposta_vista_em >= desde:
            eventos.append({"tipo": "proposta", "quando": l.proposta_vista_em, "detalhe": None})
        if l.previa_ultima_vista_em and l.previa_ultima_vista_em >= desde:
            eventos.append({"tipo": "previa", "quando": l.previa_ultima_vista_em, "detalhe": l.previa_visualizacoes})
        for e in eventos:
            e.setdefault("lead", LeadOut.model_validate(l))
    eventos.sort(key=lambda e: e["quando"], reverse=True)
    return eventos[:12]


@router.post("/{lead_id}/previa", response_model=LeadOut)
def gerar_previa(lead_id: int, user: UserTable = Depends(usuario_atual), db: Session = Depends(get_db)):
    """Busca fotos, avaliações e horários no Google e escreve os textos da prévia."""
    lead = _meu_lead(lead_id, user, db)
    if lead.fonte == "google":
        detalhes = previa_service.buscar_detalhes_google(lead.place_id)
        if detalhes:
            lead.detalhes = json.dumps(detalhes, ensure_ascii=False)
    detalhes = previa_service.carregar(lead.detalhes) or {}
    modelo = previa_service.detectar_modelo(lead.categoria, lead.nome)
    if not os.getenv("ANTHROPIC_API_KEY"):
        # sem IA configurada: texto padrão do segmento
        textos = previa_service.textos_reserva(modelo, lead.nome, lead.endereco, lead.categoria)
    else:
        textos, _ = ia_service.gerar_textos_previa(
            {
                "nome": lead.nome,
                "categoria": lead.categoria,
                "bairro": previa_service.bairro_de(lead.endereco),
                "endereco": lead.endereco,
                "nota_google": lead.avaliacao,
                "numero_de_avaliacoes": lead.num_avaliacoes,
                "resumo_google": detalhes.get("resumo", ""),
                "horarios": detalhes.get("horarios", []),
                "avaliacoes_de_clientes": [a["texto"] for a in detalhes.get("avaliacoes", [])],
            },
            lead.idioma,
        )
    lead.previa_textos = json.dumps(textos, ensure_ascii=False)
    lead.previa_gerada_em = _agora()
    db.commit()
    db.refresh(lead)
    return lead


@router.post("/{lead_id}/envio", response_model=LeadOut)
def registrar_envio(lead_id: int, dados: EnvioIn, user: UserTable = Depends(usuario_atual), db: Session = Depends(get_db)):
    """Chamado quando você abre o WhatsApp com uma mensagem da sequência."""
    lead = _meu_lead(lead_id, user, db)
    # contador diário para proteger o número de WhatsApp
    hoje = _hoje_brasilia()
    user.envios_hoje = (user.envios_hoje or 0) + 1 if user.envios_data == hoje else 1
    user.envios_data = hoje
    if dados.whatsapp is not None and so_digitos(dados.whatsapp) != lead.whatsapp:
        lead.whatsapp = so_digitos(dados.whatsapp)
        lead.whatsapp_provavel = provavel_celular(lead.whatsapp) if lead.whatsapp else False
    momento = _agora()
    if dados.passo == "previa":
        lead.previa_enviada_em = lead.previa_enviada_em or momento
    elif dados.passo == "proposta":
        lead.proposta_enviada_em = lead.proposta_enviada_em or momento
    if dados.passo in ("pos1", "pos2", "pos3"):
        lead.pos_passo = max(lead.pos_passo or 0, int(dados.passo[-1]))
    elif dados.passo == "objecao":
        pass  # resposta a uma objeção: só registra o envio
    elif dados.passo in ("previa", "proposta"):
        if not lead.respondeu:
            lead.respondeu = True
            lead.respondeu_no_passo = lead.passo or 1
        if dados.passo == "proposta" and lead.status not in ("fechado", "perdido"):
            lead.status = "proposta"
        elif lead.status in ("novo", "contatado"):
            lead.status = "respondeu"
    elif dados.passo == "questionario":
        lead.questionario_enviado = True
        if not lead.respondeu:  # mandou o link, então houve conversa
            lead.respondeu = True
            lead.respondeu_no_passo = lead.passo or 1
    else:
        lead.passo = max(lead.passo or 0, NUM_PASSO[dados.passo])
        if lead.status == "novo":
            lead.status = "contatado"
    lead.ultimo_envio_em = _agora()
    db.commit()
    db.refresh(lead)
    return lead


@router.post("/{lead_id}/resposta", response_model=LeadOut)
def registrar_resposta(lead_id: int, user: UserTable = Depends(usuario_atual), db: Session = Depends(get_db)):
    """Marca que o lead respondeu (e em qual mensagem). Chamar de novo desfaz."""
    lead = _meu_lead(lead_id, user, db)
    if lead.respondeu:
        lead.respondeu, lead.respondeu_no_passo = False, None
        if lead.status == "respondeu":
            lead.status = "contatado"
    else:
        lead.respondeu, lead.respondeu_no_passo = True, lead.passo or 1
        if lead.status in ("novo", "contatado"):
            lead.status = "respondeu"
    db.commit()
    db.refresh(lead)
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
