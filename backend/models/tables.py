import json
import random
import secrets
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from database.connection import Base
from models.modelos_mensagem import MODELOS_PADRAO, TONS
from models.pacotes import PACOTES_PADRAO


def agora():
    return datetime.now(timezone.utc)


def novo_token():
    return secrets.token_urlsafe(9)


def modelos_padrao():
    return json.dumps(MODELOS_PADRAO, ensure_ascii=False)


def pacotes_padrao():
    return json.dumps(PACOTES_PADRAO, ensure_ascii=False)


def sortear_tom():
    return random.choice(TONS)


class UserTable(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True)
    nome = Column(String(120), nullable=False)
    email = Column(String(160), unique=True, nullable=False, index=True)
    senha_hash = Column(String(200), nullable=False)
    empresa = Column(String(120), default="")
    whatsapp = Column(String(30), default="")
    token_publico = Column(String(32), unique=True, default=novo_token)
    meta_mensal = Column(Integer, default=4)  # clientes por mês
    # Proposta e pagamento
    pacotes = Column(Text, default=pacotes_padrao)  # JSON: lista de pacotes
    pix_chave = Column(String(120), default="")
    pix_nome = Column(String(60), default="")
    pix_cidade = Column(String(40), default="JOAO PESSOA")
    entrada_percentual = Column(Integer, default=50)
    modelos = Column(Text, default=modelos_padrao)  # JSON: idioma -> tom -> passo -> texto
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
    # Sequência de contato
    tom = Column(String(20), default=sortear_tom)  # formal | descontraido (sorteado)
    passo = Column(Integer, default=0)  # 0 nada enviado, 1 abertura, 2 retorno1, 3 retorno2
    ultimo_envio_em = Column(DateTime, nullable=True)
    respondeu = Column(Boolean, default=False)
    respondeu_no_passo = Column(Integer, nullable=True)  # qual mensagem fez a pessoa responder
    questionario_enviado = Column(Boolean, default=False)
    # Prévia automática (dados do Google + textos) e acompanhamento
    detalhes = Column(Text, nullable=True)  # JSON: fotos, avaliações, horários
    previa_textos = Column(Text, nullable=True)  # JSON
    previa_gerada_em = Column(DateTime, nullable=True)
    previa_vista_em = Column(DateTime, nullable=True)  # primeira vez que o cliente abriu
    previa_ultima_vista_em = Column(DateTime, nullable=True)
    previa_visualizacoes = Column(Integer, default=0)
    proposta_vista_em = Column(DateTime, nullable=True)
    proposta_escolha = Column(String(40), nullable=True)
    proposta_escolha_em = Column(DateTime, nullable=True)
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
    textos = Column(Text, nullable=True)  # JSON com os textos da prévia (gerados por IA e revisados por você)
    textos_modelo = Column(String(60), nullable=True)
    lido = Column(Boolean, default=False)
    criado_em = Column(DateTime, default=agora)

    lead = relationship("LeadTable", back_populates="briefings")
