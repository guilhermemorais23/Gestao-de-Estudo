from datetime import datetime
from typing import Any, Literal

import copy
import json

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from models.modelos_mensagem import MODELOS_PADRAO

STATUS_LEAD = Literal["novo", "contatado", "respondeu", "questionario", "proposta", "fechado", "perdido"]
PASSO = Literal["abertura", "previa", "questionario", "proposta", "retorno1", "retorno2"]


class RegistroIn(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    email: EmailStr
    senha: str = Field(min_length=6, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    senha: str


class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nome: str
    email: str
    empresa: str | None
    whatsapp: str | None
    token_publico: str
    meta_mensal: int | None = 4
    modelos: dict[str, Any]

    pacotes: list[dict[str, Any]] = []
    pix_chave: str | None = ""
    pix_nome: str | None = ""
    pix_cidade: str | None = ""
    entrada_percentual: int | None = 50

    @field_validator("modelos", mode="before")
    @classmethod
    def _json(cls, v):
        salvos = json.loads(v) if isinstance(v, str) else (v or {})
        # completa com os passos novos que a conta ainda não tem
        completos = copy.deepcopy(MODELOS_PADRAO)
        for idioma, tons in salvos.items():
            for tom, passos in tons.items():
                completos.setdefault(idioma, {}).setdefault(tom, {}).update(passos)
        return completos

    @field_validator("pacotes", mode="before")
    @classmethod
    def _pacotes(cls, v):
        return json.loads(v) if isinstance(v, str) else (v or [])


class ConfigIn(BaseModel):
    nome: str | None = None
    empresa: str | None = None
    whatsapp: str | None = None
    modelos: dict[str, dict[str, dict[str, str]]] | None = None
    meta_mensal: int | None = Field(default=None, ge=1, le=100)
    pacotes: list["PacoteIn"] | None = None
    pix_chave: str | None = Field(default=None, max_length=120)
    pix_nome: str | None = Field(default=None, max_length=60)
    pix_cidade: str | None = Field(default=None, max_length=40)
    entrada_percentual: int | None = Field(default=None, ge=0, le=100)


class PacoteIn(BaseModel):
    id: str = Field(min_length=1, max_length=40)
    nome: str = Field(min_length=1, max_length=80)
    preco: float = Field(ge=0)
    mensalidade: float = Field(default=0, ge=0)
    prazo_dias: int = Field(default=7, ge=1, le=365)
    descricao: str = Field(default="", max_length=400)
    itens: list[str] = Field(default_factory=list, max_length=12)
    recomendado: bool = False


class BuscaIn(BaseModel):
    termo: str = Field(min_length=2, max_length=120)
    cidade: str = Field(min_length=2, max_length=160)
    fonte: Literal["google", "osm"] = "google"
    regiao: Literal["pb", "exterior"] = "pb"
    idioma: Literal["pt", "en", "es"] = "pt"
    incluir_so_rede_social: bool = True
    paginas: int = Field(default=1, ge=1, le=3)


class LeadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    fonte: str
    nome: str
    categoria: str | None
    endereco: str | None
    cidade: str | None
    regiao: str
    idioma: str
    telefone: str | None
    whatsapp: str | None
    whatsapp_provavel: bool
    website: str | None
    so_rede_social: bool
    avaliacao: float | None
    num_avaliacoes: int | None
    maps_url: str | None
    score: int
    status: str
    notas: str | None
    token: str
    criado_em: datetime
    tom: str
    passo: int
    ultimo_envio_em: datetime | None
    respondeu: bool
    respondeu_no_passo: int | None
    questionario_enviado: bool
    previa_gerada_em: datetime | None = None
    previa_vista_em: datetime | None = None
    previa_ultima_vista_em: datetime | None = None
    previa_visualizacoes: int | None = 0
    proposta_vista_em: datetime | None = None
    proposta_escolha: str | None = None
    proposta_escolha_em: datetime | None = None


class LeadUpdate(BaseModel):
    status: STATUS_LEAD | None = None
    notas: str | None = None
    whatsapp: str | None = None
    idioma: Literal["pt", "en", "es"] | None = None
    tom: Literal["formal", "descontraido"] | None = None


class EnvioIn(BaseModel):
    passo: PASSO
    whatsapp: str | None = None


class LeadManualIn(BaseModel):
    nome: str = Field(min_length=2, max_length=200)
    telefone: str = ""
    cidade: str = ""
    categoria: str = ""
    regiao: Literal["pb", "exterior"] = "pb"
    idioma: Literal["pt", "en", "es"] = "pt"


class BriefingIn(BaseModel):
    empresa: str = Field(min_length=1, max_length=200)
    contato_nome: str = Field(min_length=1, max_length=120)
    contato_whatsapp: str = Field(default="", max_length=30)
    respostas: dict[str, Any]


class BriefingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    lead_id: int | None
    token: str
    empresa: str
    contato_nome: str
    contato_whatsapp: str
    respostas: dict[str, Any]
    textos: dict[str, Any] | None = None
    textos_modelo: str | None = None
    lido: bool
    criado_em: datetime


class ServicoIn(BaseModel):
    nome: str = Field(max_length=120)
    descricao: str = Field(max_length=400)


class TextosIn(BaseModel):
    titulo: str = Field(max_length=200)
    subtitulo: str = Field(max_length=300)
    sobre: str = Field(max_length=1500)
    servicos: list[ServicoIn] = Field(max_length=8)
    diferenciais: list[str] = Field(max_length=5)
    chamada_final: str = Field(max_length=300)
    texto_botao: str = Field(max_length=60)


ConfigIn.model_rebuild()
