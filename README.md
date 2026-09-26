# Prospecta PB

MVP para **encontrar empresas sem site** (João Pessoa, toda a Paraíba e outras regiões), abordar pelo
WhatsApp, aplicar um **questionário (briefing)** e gerar automaticamente uma **prévia de landing page**
para fechar a venda de sites e sistemas.

## Fluxo

1. **Prospectar** — busca no Google Maps (Places API) ou OpenStreetMap, por segmento, cidade e bairro.
   Só ficam as empresas **sem site** (ou com só Instagram/Facebook), com um **potencial de 0 a 100**.
2. **Abordar** — sequência no WhatsApp com **tom sorteado** (formal ou descontraído) para comparar:
   1ª mensagem (sem link) → **prévia** → **proposta**, com retornos se a pessoa não responder.
   Tudo via `wa.me` e **QR code**; cada envio fica registrado.
3. **Prévia automática** — o botão "Gerar prévia" busca **fotos, avaliações e horários** do lugar no
   Google e escreve os textos com IA (Claude Haiku 4.5). O visual muda por segmento (beleza, saúde,
   comida, serviços) e o cliente vê num celular ou no computador (`/p/<token>`).
4. **Atividade** — você é avisado quando o cliente **abre a prévia** (quantas vezes), abre a proposta ou
   escolhe um pacote. Suas próprias visitas logado não contam.
5. **Proposta** — página com seus pacotes, prazo e o **PIX da entrada** (QR code e copia e cola, já com o
   valor), em `/proposta/<token>`. Pacotes e chave PIX em Configurações.
6. **Questionário (opcional)** — o dono responde em `/q/<token>` para personalizar a prévia.
7. **Resultados** — funil por tom, onde as pessoas param e calculadora de metas.
8. **Outras regiões / exterior** — mesma busca em qualquer cidade/país, mensagens em inglês ou espanhol.

### Custos das APIs

- Busca de empresas: faixa Pro/Enterprise do Google Places (o campo de site entra na conta).
- Prévia com fotos e avaliações: faixa **Enterprise + Atmosphere** do Google, uma chamada por prévia
  gerada (algo na casa de US$ 0,02–0,04), mais cada foto exibida. Confira a tabela atual do Google.
- Textos com IA: frações de centavo de dólar por texto com o Haiku 4.5.

## Colocar no ar

Veja o [DEPLOY.md](DEPLOY.md): Render (~US$ 7/mês, mais simples) ou VPS (~R$ 30/mês).

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
