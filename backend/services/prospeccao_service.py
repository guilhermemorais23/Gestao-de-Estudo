"""Busca empresas no Google Maps (Places API) ou no OpenStreetMap e separa as que não têm site."""
import os
import re

import httpx
from fastapi import HTTPException

from utils.telefone import provavel_celular, telefone_whatsapp

GOOGLE_URL = "https://places.googleapis.com/v1/places:searchText"
GOOGLE_CAMPOS = ",".join(
    [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.nationalPhoneNumber",
        "places.internationalPhoneNumber",
        "places.websiteUri",
        "places.rating",
        "places.userRatingCount",
        "places.googleMapsUri",
        "places.primaryTypeDisplayName",
        "places.businessStatus",
        "nextPageToken",
    ]
)
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Link de rede social/agregador não é site de verdade: esse cliente também é oportunidade.
DOMINIOS_SEM_SITE = (
    "instagram.com", "facebook.com", "fb.com", "wa.me", "whatsapp.com", "linktr.ee",
    "linktree", "tiktok.com", "ifood.com.br", "goo.gl", "g.page", "business.site",
    "sites.google.com", "bio.link", "beacons.ai",
)

# Termos comuns em português -> tags do OpenStreetMap
OSM_CATEGORIAS = {
    "restaurante": ("amenity", "restaurant"),
    "lanchonete": ("amenity", "fast_food"),
    "hamburgueria": ("amenity", "fast_food"),
    "pizzaria": ("amenity", "restaurant"),
    "bar": ("amenity", "bar"),
    "cafe": ("amenity", "cafe"),
    "cafeteria": ("amenity", "cafe"),
    "padaria": ("shop", "bakery"),
    "salao": ("shop", "hairdresser"),
    "cabeleireiro": ("shop", "hairdresser"),
    "barbearia": ("shop", "hairdresser"),
    "estetica": ("shop", "beauty"),
    "manicure": ("shop", "beauty"),
    "academia": ("leisure", "fitness_centre"),
    "clinica": ("amenity", "clinic"),
    "dentista": ("amenity", "dentist"),
    "odontologia": ("amenity", "dentist"),
    "farmacia": ("amenity", "pharmacy"),
    "veterinario": ("amenity", "veterinary"),
    "petshop": ("shop", "pet"),
    "pet shop": ("shop", "pet"),
    "oficina": ("shop", "car_repair"),
    "mecanica": ("shop", "car_repair"),
    "mercado": ("shop", "supermarket"),
    "supermercado": ("shop", "supermarket"),
    "loja de roupas": ("shop", "clothes"),
    "roupas": ("shop", "clothes"),
    "otica": ("shop", "optician"),
    "hotel": ("tourism", "hotel"),
    "pousada": ("tourism", "guest_house"),
    "imobiliaria": ("office", "estate_agent"),
    "advogado": ("office", "lawyer"),
    "contabilidade": ("office", "accountant"),
    "floricultura": ("shop", "florist"),
    "material de construcao": ("shop", "hardware"),
}


def _sem_acento(texto: str) -> str:
    tabela = str.maketrans("áàâãäéèêëíìîïóòôõöúùûüç", "aaaaaeeeeiiiiooooouuuuc")
    return texto.lower().translate(tabela).strip()


def eh_so_rede_social(url: str) -> bool:
    url = (url or "").lower()
    return any(d in url for d in DOMINIOS_SEM_SITE)


def calcular_score(lead: dict) -> int:
    """0-100: quanto maior, mais quente o lead (empresa ativa, fácil de contatar, sem site)."""
    score = 0
    if not lead["website"]:
        score += 35
    elif lead["so_rede_social"]:
        score += 25
    if lead["whatsapp"]:
        score += 15
    if lead["whatsapp_provavel"]:
        score += 15
    avaliacoes = lead.get("num_avaliacoes") or 0
    score += min(25, avaliacoes // 4)  # muitas avaliações = empresa movimentada, tem dinheiro
    if (lead.get("avaliacao") or 0) >= 4.3:
        score += 10
    return min(100, score)


def _montar_lead(dados: dict) -> dict:
    wa = telefone_whatsapp(dados.get("telefone_internacional"), dados.get("telefone"))
    lead = {
        "place_id": dados["place_id"],
        "fonte": dados["fonte"],
        "nome": dados["nome"][:200],
        "categoria": (dados.get("categoria") or "")[:120],
        "endereco": (dados.get("endereco") or "")[:300],
        "telefone": dados.get("telefone") or dados.get("telefone_internacional") or "",
        "whatsapp": wa,
        "whatsapp_provavel": provavel_celular(wa) if wa else False,
        "website": (dados.get("website") or "")[:300],
        "avaliacao": dados.get("avaliacao"),
        "num_avaliacoes": dados.get("num_avaliacoes") or 0,
        "maps_url": dados.get("maps_url") or "",
    }
    lead["so_rede_social"] = bool(lead["website"]) and eh_so_rede_social(lead["website"])
    lead["score"] = calcular_score(lead)
    return lead


def buscar_google(termo: str, cidade: str, idioma: str, regiao: str, paginas: int) -> list[dict]:
    chave = os.getenv("GOOGLE_MAPS_API_KEY", "")
    if not chave:
        raise HTTPException(
            status_code=400,
            detail="GOOGLE_MAPS_API_KEY não configurada no backend/.env. Use a fonte OpenStreetMap enquanto isso.",
        )
    corpo = {
        "textQuery": f"{termo} em {cidade}",
        "languageCode": {"pt": "pt-BR", "en": "en", "es": "es"}[idioma],
        "pageSize": 20,
    }
    if regiao == "pb":
        corpo["regionCode"] = "BR"

    resultados = []
    with httpx.Client(timeout=30) as cliente:
        for _ in range(paginas):
            resp = cliente.post(
                GOOGLE_URL,
                json=corpo,
                headers={"X-Goog-Api-Key": chave, "X-Goog-FieldMask": GOOGLE_CAMPOS},
            )
            if resp.status_code != 200:
                msg = resp.json().get("error", {}).get("message", resp.text[:200])
                raise HTTPException(status_code=502, detail=f"Google Places: {msg}")
            dados = resp.json()
            for p in dados.get("places", []):
                if p.get("businessStatus") not in (None, "OPERATIONAL"):
                    continue
                resultados.append(
                    _montar_lead(
                        {
                            "place_id": p["id"],
                            "fonte": "google",
                            "nome": p.get("displayName", {}).get("text", "Sem nome"),
                            "categoria": p.get("primaryTypeDisplayName", {}).get("text", ""),
                            "endereco": p.get("formattedAddress", ""),
                            "telefone": p.get("nationalPhoneNumber"),
                            "telefone_internacional": p.get("internationalPhoneNumber"),
                            "website": p.get("websiteUri"),
                            "avaliacao": p.get("rating"),
                            "num_avaliacoes": p.get("userRatingCount"),
                            "maps_url": p.get("googleMapsUri"),
                        }
                    )
                )
            token = dados.get("nextPageToken")
            if not token:
                break
            corpo["pageToken"] = token
    return resultados


def buscar_osm(termo: str, cidade: str) -> list[dict]:
    """Gratuito e sem chave. Cobertura menor que a do Google, mas bom pra começar."""
    nome_cidade = cidade.split(",")[0].split("/")[0].split(" - ")[0].strip()
    chave_termo = _sem_acento(termo)
    tag = OSM_CATEGORIAS.get(chave_termo)
    if tag:
        filtro = f'["{tag[0]}"="{tag[1]}"]["name"]'
    else:
        seguro = re.sub(r'["\\\]\[]', "", termo)
        filtro = f'["name"~"{seguro}",i][~"^(shop|amenity|craft|office|healthcare|leisure|tourism)$"~"."]'
    consulta = f"""
    [out:json][timeout:60];
    area["name"="{nome_cidade}"]["boundary"="administrative"]->.a;
    nwr(area.a){filtro};
    out center tags 300;
    """
    try:
        resp = httpx.post(
            OVERPASS_URL, data={"data": consulta}, timeout=90, headers={"User-Agent": "prospecta-pb/0.1"}
        )
        resp.raise_for_status()
    except httpx.HTTPError as erro:
        raise HTTPException(status_code=502, detail=f"OpenStreetMap indisponível: {erro}")

    resultados = []
    for el in resp.json().get("elements", []):
        t = el.get("tags", {})
        rua = " ".join(filter(None, [t.get("addr:street"), t.get("addr:housenumber")]))
        endereco = ", ".join(filter(None, [rua, t.get("addr:suburb"), nome_cidade]))
        lat = el.get("lat") or el.get("center", {}).get("lat")
        lon = el.get("lon") or el.get("center", {}).get("lon")
        resultados.append(
            _montar_lead(
                {
                    "place_id": f"osm:{el['type']}/{el['id']}",
                    "fonte": "osm",
                    "nome": t.get("name", "Sem nome"),
                    "categoria": t.get("shop") or t.get("amenity") or t.get("craft") or t.get("office") or "",
                    "endereco": endereco,
                    "telefone": t.get("phone") or t.get("contact:phone") or t.get("contact:whatsapp"),
                    "website": t.get("website") or t.get("contact:website") or t.get("contact:instagram"),
                    "maps_url": f"https://www.google.com/maps/search/?api=1&query={lat},{lon}" if lat else "",
                }
            )
        )
    return resultados


def buscar(termo, cidade, fonte, idioma, regiao, paginas, incluir_so_rede_social) -> tuple[list[dict], int]:
    """Retorna (leads_sem_site, total_encontrado)."""
    if fonte == "google":
        todos = buscar_google(termo, cidade, idioma, regiao, paginas)
    else:
        todos = buscar_osm(termo, cidade)
    filtrados = [
        l for l in todos if not l["website"] or (incluir_so_rede_social and l["so_rede_social"])
    ]
    for l in filtrados:
        l["cidade"] = cidade[:120]
        l["regiao"] = regiao
        l["idioma"] = idioma
    return filtrados, len(todos)
