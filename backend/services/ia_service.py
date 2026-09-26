"""Gera os textos da prévia de landing page a partir do questionário, usando a API da Anthropic."""
import json
import os

import anthropic
from fastapi import HTTPException
from pydantic import BaseModel

# Modelos liberados. Para adicionar outro no futuro, basta incluir aqui e escolher via IA_MODELO no .env.
MODELOS_IA = {
    "claude-haiku-4-5": "Claude Haiku 4.5",
}
MODELO_PADRAO = "claude-haiku-4-5"

IDIOMA_NOME = {"pt": "português do Brasil", "en": "inglês", "es": "espanhol"}


class Servico(BaseModel):
    nome: str
    descricao: str


class TextosLanding(BaseModel):
    titulo: str
    subtitulo: str
    sobre: str
    servicos: list[Servico]
    diferenciais: list[str]
    chamada_final: str
    texto_botao: str


SISTEMA = """Você escreve os textos de landing pages para pequenos negócios locais.

Receberá as respostas de um questionário preenchido pelo dono do negócio. Escreva os textos da página \
no idioma pedido, com base só nessas respostas.

Regras:
- Não invente fatos: nada de anos de experiência, prêmios, números de clientes, preços, depoimentos ou \
certificações que não estejam nas respostas. Se faltar informação, escreva algo verdadeiro e mais genérico.
- Escreva como o próprio negócio falaria com o cliente do bairro: frases curtas, palavras simples, tom \
caloroso e direto. Evite clichês de marketing ("soluções completas", "excelência", "qualidade \
incomparável", "transforme", "eleve"), exclamações em excesso e emojis.
- titulo: até 8 palavras, diz o que o negócio faz ou o benefício principal. Pode usar o nome da empresa.
- subtitulo: uma frase de até 20 palavras que complementa o título.
- sobre: um parágrafo de 2 a 3 frases sobre o negócio.
- servicos: um item para cada serviço ou produto citado (no máximo 6), cada um com uma descrição de \
uma frase. Se nenhum foi citado, deduza de 2 a 3 serviços óbvios do segmento, sem detalhes específicos.
- diferenciais: de 2 a 3 frases curtas, tiradas do que o dono disse que diferencia o negócio.
- chamada_final: uma frase convidando a pessoa a chamar no WhatsApp.
- texto_botao: até 4 palavras, verbo no imperativo, para o botão de WhatsApp."""


def modelo_configurado() -> str:
    modelo = os.getenv("IA_MODELO", MODELO_PADRAO)
    return modelo if modelo in MODELOS_IA else MODELO_PADRAO


def gerar_textos_landing(respostas: dict, idioma: str = "pt") -> tuple[dict, str]:
    """Retorna (textos, modelo_usado)."""
    if not os.getenv("ANTHROPIC_API_KEY"):
        raise HTTPException(
            status_code=400,
            detail="ANTHROPIC_API_KEY não configurada no backend/.env. Crie a chave em console.anthropic.com.",
        )
    modelo = modelo_configurado()
    dados = {k: v for k, v in respostas.items() if not k.startswith("_") and v not in ("", [], None)}
    pedido = (
        f"Idioma dos textos: {IDIOMA_NOME.get(idioma, IDIOMA_NOME['pt'])}.\n\n"
        f"Respostas do questionário:\n{json.dumps(dados, ensure_ascii=False, indent=2)}"
    )

    cliente = anthropic.Anthropic()
    try:
        resposta = cliente.messages.parse(
            model=modelo,
            max_tokens=4000,
            system=SISTEMA,
            messages=[{"role": "user", "content": pedido}],
            output_format=TextosLanding,
        )
    except anthropic.AuthenticationError:
        raise HTTPException(status_code=400, detail="A chave da Anthropic é inválida. Confira ANTHROPIC_API_KEY.")
    except anthropic.RateLimitError:
        raise HTTPException(status_code=429, detail="Limite de uso da IA atingido. Tente de novo em um minuto.")
    except anthropic.APIConnectionError:
        raise HTTPException(status_code=502, detail="Não foi possível falar com a API da Anthropic. Verifique a internet.")
    except anthropic.APIStatusError as erro:
        raise HTTPException(status_code=502, detail=f"Erro na API da Anthropic: {erro.message}")

    if resposta.stop_reason == "refusal" or resposta.parsed_output is None:
        raise HTTPException(status_code=422, detail="A IA não conseguiu gerar os textos. Revise as respostas e tente de novo.")
    if resposta.stop_reason == "max_tokens":
        raise HTTPException(status_code=502, detail="Os textos ficaram longos demais e foram cortados. Tente de novo.")

    return resposta.parsed_output.model_dump(), modelo
