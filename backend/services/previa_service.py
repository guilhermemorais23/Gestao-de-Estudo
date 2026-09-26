"""Prévia automática do site: dados do Google Maps + textos (IA ou modelo pronto) + modelo visual por segmento."""
import json
import os
import re
import time

import httpx
from fastapi import HTTPException

DETALHES_URL = "https://places.googleapis.com/v1/places/{place_id}"
FOTO_URL = "https://places.googleapis.com/v1/{nome}/media"
# Pedir fotos ou avaliações coloca a chamada na faixa Enterprise + Atmosphere do Google.
# Por isso só buscamos quando você gera a prévia de um lead, não em toda busca.
DETALHES_CAMPOS = "photos,reviews,regularOpeningHours,editorialSummary,googleMapsUri"

# Modelo visual por segmento. A chave é detectada pela categoria do Google ou pelo questionário.
SEGMENTOS = {
    "beleza": ["barbearia", "barber", "salão", "salao", "cabeleireir", "estética", "estetica", "manicure", "unha",
               "sobrancelha", "cílios", "cilios", "maquiag", "tatuag", "tattoo", "spa", "beauty", "hair", "nail"],
    "saude": ["dentista", "odonto", "clínica", "clinica", "médic", "medic", "fisioterap", "psicólog", "psicolog",
              "nutricion", "fonoaudi", "pilates", "academia", "personal", "veterin", "laborat", "dentist", "clinic"],
    "comida": ["restaurante", "lanchonete", "pizzaria", "hamburguer", "açaí", "acai", "padaria", "confeitaria",
               "doceria", "bar", "café", "cafe", "cafeteria", "sorveteria", "marmit", "churrasc", "pastel",
               "sushi", "comida", "restaurant", "bakery", "food"],
}


def detectar_modelo(*textos: str) -> str:
    alvo = " ".join(t for t in textos if t).lower()
    for modelo, termos in SEGMENTOS.items():
        if any(t in alvo for t in termos):
            return modelo
    return "servicos"


def buscar_detalhes_google(place_id: str) -> dict:
    """Fotos, avaliações e horários do lugar. Retorna {} se não houver chave."""
    chave = os.getenv("GOOGLE_MAPS_API_KEY", "")
    if not chave:
        return {}
    try:
        resp = httpx.get(
            DETALHES_URL.format(place_id=place_id),
            headers={"X-Goog-Api-Key": chave, "X-Goog-FieldMask": DETALHES_CAMPOS},
            params={"languageCode": "pt-BR"},
            timeout=20,
        )
    except httpx.HTTPError as erro:
        raise HTTPException(status_code=502, detail=f"Google Places indisponível: {erro}")
    if resp.status_code != 200:
        msg = resp.json().get("error", {}).get("message", resp.text[:200])
        raise HTTPException(status_code=502, detail=f"Google Places: {msg}")
    d = resp.json()
    fotos = [
        {
            "nome": f["name"],
            "autor": (f.get("authorAttributions") or [{}])[0].get("displayName", ""),
            "autor_uri": (f.get("authorAttributions") or [{}])[0].get("uri", ""),
        }
        for f in d.get("photos", [])[:8]
    ]
    avaliacoes = [
        {
            "autor": r.get("authorAttribution", {}).get("displayName", ""),
            "autor_uri": r.get("authorAttribution", {}).get("uri", ""),
            "nota": r.get("rating"),
            "texto": (r.get("text") or r.get("originalText") or {}).get("text", ""),
            "quando": r.get("relativePublishTimeDescription", ""),
        }
        for r in d.get("reviews", [])
        if (r.get("rating") or 0) >= 4 and (r.get("text") or r.get("originalText"))
    ][:5]
    return {
        "fotos": fotos,
        "avaliacoes": avaliacoes,
        "horarios": d.get("regularOpeningHours", {}).get("weekdayDescriptions", []),
        "resumo": d.get("editorialSummary", {}).get("text", ""),
        "maps_url": d.get("googleMapsUri", ""),
    }


_cache_fotos: dict[str, tuple[float, str]] = {}


def url_foto(nome: str, largura: int = 1200) -> str:
    """URL temporária da foto no Google. A chave nunca vai para o navegador."""
    chave = os.getenv("GOOGLE_MAPS_API_KEY", "")
    if not chave:
        raise HTTPException(status_code=404, detail="Foto indisponível")
    cache_chave = f"{nome}:{largura}"
    salvo = _cache_fotos.get(cache_chave)
    if salvo and salvo[0] > time.time():
        return salvo[1]
    try:
        resp = httpx.get(
            FOTO_URL.format(nome=nome),
            params={"maxWidthPx": largura, "skipHttpRedirect": "true", "key": chave},
            timeout=15,
        )
        resp.raise_for_status()
    except httpx.HTTPError:
        raise HTTPException(status_code=404, detail="Foto indisponível")
    uri = resp.json().get("photoUri", "")
    _cache_fotos[cache_chave] = (time.time() + 30 * 60, uri)
    return uri


# Textos de reserva quando não há IA configurada
TEXTOS_BASE = {
    "beleza": {
        "titulo": "{empresa}: seu horário, do seu jeito",
        "subtitulo": "Atendimento com hora marcada no {bairro}. Chame no WhatsApp e garanta seu horário.",
        "servicos": ["Corte", "Barba", "Tratamentos", "Pacotes"],
        "diferenciais": ["Horário marcado, sem fila", "Ambiente confortável", "Agendamento pelo WhatsApp"],
        "botao": "Agendar horário",
    },
    "saude": {
        "titulo": "Cuidado de perto, no {bairro}",
        "subtitulo": "Agende sua consulta pelo WhatsApp e tire suas dúvidas antes de vir.",
        "servicos": ["Consulta de avaliação", "Tratamentos", "Retorno e acompanhamento"],
        "diferenciais": ["Atendimento com hora marcada", "Explicação clara de cada etapa", "Agendamento pelo WhatsApp"],
        "botao": "Agendar consulta",
    },
    "comida": {
        "titulo": "{empresa}, direto para a sua mesa",
        "subtitulo": "Veja o cardápio e faça seu pedido pelo WhatsApp.",
        "servicos": ["Pratos da casa", "Bebidas", "Pedidos para viagem"],
        "diferenciais": ["Pedido rápido pelo WhatsApp", "Feito na hora", "No {bairro}"],
        "botao": "Fazer pedido",
    },
    "servicos": {
        "titulo": "{empresa}: serviço bem feito no {bairro}",
        "subtitulo": "Mande uma mensagem, explique o que precisa e receba o orçamento pelo WhatsApp.",
        "servicos": ["Orçamento", "Serviço", "Acompanhamento"],
        "diferenciais": ["Orçamento antes de começar", "Atendimento direto", "Resposta rápida no WhatsApp"],
        "botao": "Pedir orçamento",
    },
}


def bairro_de(endereco: str) -> str:
    """Tenta tirar o bairro de 'Rua X, 100 - Manaíra, João Pessoa - PB, 58038-000, Brasil'."""
    partes = [p.strip() for p in (endereco or "").split(",")]
    for p in partes:
        if " - " in p:
            candidato = p.split(" - ")[-1].strip()
            if candidato and not candidato.isupper() and not any(c.isdigit() for c in candidato):
                return candidato
    rua = re.compile(r"^(av|avenida|rua|r|travessa|tv|rodovia|alameda|estrada)\.?\s", re.I)
    for p in partes:
        if p and not any(c.isdigit() for c in p) and p.lower() not in ("brasil", "brazil") and not rua.match(p):
            return p
    return "seu bairro"


def textos_reserva(modelo: str, empresa: str, endereco: str, categoria: str) -> dict:
    base = TEXTOS_BASE[modelo]
    bairro = bairro_de(endereco)
    fmt = lambda s: s.format(empresa=empresa, bairro=bairro)  # noqa: E731
    return {
        "titulo": fmt(base["titulo"]),
        "subtitulo": fmt(base["subtitulo"]),
        "sobre": f"A {empresa} atende {bairro} e região{f' com {categoria.lower()}' if categoria else ''}. "
                 "Chame no WhatsApp para tirar dúvidas, ver horários e combinar o atendimento.",
        "servicos": [{"nome": s, "descricao": ""} for s in base["servicos"]],
        "diferenciais": [fmt(d) for d in base["diferenciais"]],
        "chamada_final": "Mande uma mensagem agora e seja atendido ainda hoje.",
        "texto_botao": base["botao"],
    }


def carregar(json_texto):
    return json.loads(json_texto) if json_texto else None
