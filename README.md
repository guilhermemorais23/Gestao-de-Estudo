# Prospecta PB

MVP para **encontrar empresas sem site** (João Pessoa / Paraíba e outras regiões), abordar pelo
WhatsApp, aplicar um **questionário (briefing)** e gerar automaticamente uma **prévia de landing page**
para fechar a venda de sites e sistemas.

## Fluxo

1. **Prospectar** — busca no Google Maps (Places API) ou OpenStreetMap, por segmento + cidade.
   Só ficam as empresas **sem site** (ou com só Instagram/Facebook). Cada uma recebe um **score 0–100**
   (sem site, celular com WhatsApp, muitas avaliações = lead quente).
2. **Meus leads** — mini-CRM com funil: novo → contatado → respondeu → proposta → fechado/perdido, com notas.
3. **WhatsApp** — mensagem pronta (PT/EN/ES, editável em Configurações) com link `wa.me` e **QR code**
   (escaneia com o celular e a conversa abre com o texto pronto).
4. **Questionário** — o cliente responde pelo link (`/q/<token>`); o lead muda para "respondeu".
5. **Prévia** — as respostas viram uma landing page (`/lp/<token>`) com cores, serviços, mapa e botão
   de WhatsApp. O cliente é levado ao **seu** WhatsApp com o resumo das respostas.
6. **Outras regiões / exterior** — mesma busca em qualquer cidade/país, com mensagem em inglês ou espanhol.

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

Abra http://localhost:5173, clique em **Criar conta** (só o primeiro usuário pode se cadastrar;
para liberar mais, use `PERMITIR_CADASTRO=1`). Depois configure seu WhatsApp em **Configurações**.

### Chave do Google Maps

1. https://console.cloud.google.com → crie um projeto → ative **Places API (New)**.
2. Crie uma chave em *APIs e serviços → Credenciais* e restrinja à Places API.
3. Cole em `backend/.env` → `GOOGLE_MAPS_API_KEY=...`

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
