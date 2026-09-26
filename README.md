# Prospecta PB

MVP para **encontrar empresas sem site** (João Pessoa / Paraíba e outras regiões), abordar pelo
WhatsApp, aplicar um **questionário (briefing)** e gerar automaticamente uma **prévia de landing page**
para fechar a venda de sites e sistemas.

## Fluxo

1. **Prospectar** — busca no Google Maps (Places API) ou OpenStreetMap, por segmento + cidade.
   Só ficam as empresas **sem site** (ou com só Instagram/Facebook). Cada uma recebe um **score 0–100**
   (sem site, celular com WhatsApp, muitas avaliações = lead quente).
2. **Meus leads** — mini-CRM com funil: novo → contatado → respondeu → proposta → fechado/perdido, com notas.
3. **Abordagem em sequência** — 1ª mensagem (curta, sem link) → questionário (só depois que a pessoa
   responde) → retorno 1 (2 dias sem resposta) → retorno 2 (encerramento). Cada lead recebe um **tom
   sorteado** (formal ou descontraído) para comparar qual converte mais. Tudo abre no WhatsApp via `wa.me`
   e **QR code**, e cada envio fica registrado. O painel avisa quem está esperando retorno.
4. **Questionário** — o cliente responde pelo link (`/q/<token>`); o lead muda para "respondeu".
5. **Textos com IA** — em Respostas, o botão "Gerar textos com IA" usa o Claude Haiku 4.5 para escrever
   título, serviços, diferenciais e chamada da prévia a partir do questionário. Você revisa e salva.
   Para outro modelo no futuro, inclua em `MODELOS_IA` (`backend/services/ia_service.py`) e use `IA_MODELO`.
6. **Prévia** — as respostas viram uma landing page (`/lp/<token>`) com cores, serviços, mapa e botão
   de WhatsApp. O cliente é levado ao **seu** WhatsApp com o resumo das respostas.
7. **Resultados** — funil por tom (quantos responderam, fizeram o questionário, fecharam), em qual
   mensagem as pessoas respondem ou param, e uma calculadora de metas (preço, clientes/mês, mensalidade).
8. **Outras regiões / exterior** — mesma busca em qualquer cidade/país, com mensagem em inglês ou espanhol.

## Rodando

```bash
# Backend (FastAPI) — porta 8000
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # coloque sua GOOGLE_MAPS_API_KEY e SECRET_KEY
uvicorn app.main:app --reload

# Frontend (React + Vite) — porta 5173
cd frontend
npm install
npm run dev
```

> Se você já tinha rodado uma versão anterior, apague `backend/prospecta.db` antes: as tabelas mudaram.

Abra http://localhost:5173, clique em **Criar conta** (só o primeiro usuário pode se cadastrar;
para liberar mais, use `PERMITIR_CADASTRO=1`). Depois configure seu WhatsApp em **Configurações**.

### Chave do Google Maps

1. https://console.cloud.google.com → crie um projeto → ative **Places API (New)**.
2. Crie uma chave em *APIs e serviços → Credenciais* e restrinja à Places API.
3. Cole em `backend/.env` → `GOOGLE_MAPS_API_KEY=...`

### Chave da Anthropic (textos com IA)

Crie em https://console.anthropic.com e cole em `backend/.env` → `ANTHROPIC_API_KEY=...`.
Cada texto de prévia custa uma fração de centavo de dólar com o Haiku 4.5.

O Google cobra por busca (há cota mensal gratuita). Cada página traz até 20 empresas.
Sem chave, use a fonte **OpenStreetMap** (grátis, mas com menos empresas cadastradas).

> Os links do questionário usam o endereço onde o painel está aberto. Para mandar para clientes de
> verdade, o sistema precisa estar publicado na internet (veja "Próximos passos").

## Estrutura

```
backend/   FastAPI + SQLAlchemy (SQLite)
  services/prospeccao_service.py   busca Google/OSM, filtro "sem site", score
  routes/                          auth, leads, briefings (+ rotas públicas)
frontend/  React + Vite
  src/pages/                       Prospectar, Leads, Respostas, Config, Questionario, LandingPreview
  src/perguntas.js                 roteiro do questionário (PT/EN/ES)
```
