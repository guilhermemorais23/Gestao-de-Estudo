from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

STATUS_LEAD = Literal["novo", "contatado", "respondeu", "proposta", "fechado", "perdido"]


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
    msg_pt: str | None
    msg_en: str | None
    msg_es: str | None


class ConfigIn(BaseModel):
    nome: str | None = None
    empresa: str | None = None
    whatsapp: str | None = None
    msg_pt: str | None = None
    msg_en: str | None = None
    msg_es: str | None = None


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


class LeadUpdate(BaseModel):
    status: STATUS_LEAD | None = None
    notas: str | None = None
    whatsapp: str | None = None
    idioma: Literal["pt", "en", "es"] | None = None


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
    lido: bool
    criado_em: datetime
