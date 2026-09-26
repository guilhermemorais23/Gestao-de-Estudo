import secrets
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from database.connection import Base


def agora():
    return datetime.now(timezone.utc)


def novo_token():
    return secrets.token_urlsafe(9)


MSG_PT = (
    "Olá, tudo bem? Aqui é {meu_nome}{minha_empresa}. Encontrei a {empresa} no Google Maps "
    "e vi que vocês ainda não têm um site. Hoje muita gente procura no Google antes de comprar, "
    "e um site simples já traz mais clientes pelo WhatsApp.\n\n"
    "Montei um questionário rápido (2 minutos) pra eu te mostrar uma prévia gratuita de como "
    "ficaria o site de vocês: {link}"
)
MSG_EN = (
    "Hi! This is {meu_nome}{minha_empresa}. I found {empresa} on Google Maps and noticed you "
    "don't have a website yet. I build simple, fast websites that bring customers straight to "
    "your WhatsApp. Answer this 2-minute form and I'll send you a free preview: {link}"
)
MSG_ES = (
    "¡Hola! Soy {meu_nome}{minha_empresa}. Encontré {empresa} en Google Maps y vi que todavía "
    "no tienen sitio web. Hago sitios simples que llevan clientes directo a su WhatsApp. "
    "Responde este formulario de 2 minutos y te envío una vista previa gratis: {link}"
)


class UserTable(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True)
    nome = Column(String(120), nullable=False)
    email = Column(String(160), unique=True, nullable=False, index=True)
    senha_hash = Column(String(200), nullable=False)
    empresa = Column(String(120), default="")
    whatsapp = Column(String(30), default="")
    token_publico = Column(String(32), unique=True, default=novo_token)
    msg_pt = Column(Text, default=MSG_PT)
    msg_en = Column(Text, default=MSG_EN)
    msg_es = Column(Text, default=MSG_ES)
    criado_em = Column(DateTime, default=agora)

    leads = relationship("LeadTable", back_populates="usuario", cascade="all, delete-orphan")


class LeadTable(Base):
    __tablename__ = "leads"
    __table_args__ = (UniqueConstraint("user_id", "place_id", name="uq_lead_usuario_place"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    place_id = Column(String(200), nullable=False)
    fonte = Column(String(20), default="google")  # google | osm | manual
    nome = Column(String(200), nullable=False)
    categoria = Column(String(120), default="")
    endereco = Column(String(300), default="")
    cidade = Column(String(120), default="")
    regiao = Column(String(20), default="pb")  # pb | exterior
    idioma = Column(String(5), default="pt")
    telefone = Column(String(40), default="")
    whatsapp = Column(String(30), default="")
    whatsapp_provavel = Column(Boolean, default=False)
    website = Column(String(300), default="")
    so_rede_social = Column(Boolean, default=False)
    avaliacao = Column(Float, nullable=True)
    num_avaliacoes = Column(Integer, default=0)
    maps_url = Column(String(400), default="")
    score = Column(Integer, default=0)
    status = Column(String(30), default="novo")
    notas = Column(Text, default="")
    token = Column(String(32), unique=True, default=novo_token)
    criado_em = Column(DateTime, default=agora)
    atualizado_em = Column(DateTime, default=agora, onupdate=agora)

    usuario = relationship("UserTable", back_populates="leads")
    briefings = relationship("BriefingTable", back_populates="lead")


class BriefingTable(Base):
    __tablename__ = "briefings"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)
    token = Column(String(32), unique=True, default=novo_token)
    empresa = Column(String(200), default="")
    contato_nome = Column(String(120), default="")
    contato_whatsapp = Column(String(30), default="")
    respostas = Column(Text, default="{}")  # JSON
    lido = Column(Boolean, default=False)
    criado_em = Column(DateTime, default=agora)

    lead = relationship("LeadTable", back_populates="briefings")
