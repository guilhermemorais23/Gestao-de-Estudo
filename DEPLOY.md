# Como colocar o Prospecta no ar

O projeto roda como **um serviço só**: o backend (FastAPI) também entrega as telas já compiladas.
O `Dockerfile` na raiz monta tudo. O banco é SQLite e precisa de um **disco persistente**, senão os
dados somem a cada atualização.

## Opção 1 — Render (mais simples, ~US$ 7,25/mês)

Não precisa mexer em servidor. Atualiza sozinho a cada push no GitHub.

1. Crie uma conta em https://render.com e conecte o GitHub.
2. **New > Blueprint** e escolha este repositório. O arquivo `render.yaml` já cria o serviço
   (plano Starter, US$ 7/mês) com 1 GB de disco (US$ 0,25/mês).
3. Preencha `GOOGLE_MAPS_API_KEY` e `ANTHROPIC_API_KEY` quando o Render pedir.
4. Abra o endereço `https://prospecta-xxxx.onrender.com`, crie sua conta e cadastre seu WhatsApp e PIX.

> O plano grátis do Render **não serve**: desliga depois de 15 minutos parado (o cliente espera ~1 minuto
> para abrir a prévia) e não tem disco, então o banco seria apagado.

## Opção 2 — VPS (mais barata, ~R$ 28–45/mês, exige um pouco de terminal)

Ex.: Hostinger KVM 1 (1 vCPU, 4 GB) com servidor no Brasil. O preço promocional vale para o plano de
24 meses; a renovação costuma subir.

```bash
# no servidor (Ubuntu), depois de instalar o Docker
git clone https://github.com/guilhermemorais23/Gestao-de-Estudo.git prospecta && cd prospecta
docker build -t prospecta .
docker run -d --name prospecta --restart unless-stopped -p 80:8000 -v prospecta-dados:/data \
  -e SECRET_KEY="$(openssl rand -hex 32)" \
  -e GOOGLE_MAPS_API_KEY=... -e ANTHROPIC_API_KEY=... \
  prospecta
```

Para HTTPS com domínio próprio, coloque o Caddy na frente (`caddy reverse-proxy --from seudominio.com.br --to :8000`).

## O que não usar

- **Vercel grátis (Hobby)**: só para projetos pessoais, **não comerciais**.
- **Oracle Cloud grátis**: a oferta foi reduzida em 2026 e muita gente não consegue criar a máquina.

## Domínio

Um `.com.br` custa cerca de R$ 40 por ano no https://registro.br. Com domínio próprio, os links que você
manda (`seudominio.com.br/p/...`) passam mais confiança do que `onrender.com`.

## Variáveis de ambiente

| Nome | Para quê |
|---|---|
| `SECRET_KEY` | Assina os logins. Use uma frase longa e aleatória |
| `GOOGLE_MAPS_API_KEY` | Busca de empresas, fotos e avaliações |
| `ANTHROPIC_API_KEY` | Textos da prévia com IA |
| `IA_MODELO` | Padrão `claude-haiku-4-5` |
| `PERMITIR_CADASTRO` | `0` = só o primeiro usuário cria conta |
| `DATABASE_URL` | Padrão no Docker: `sqlite:////data/prospecta.db` |
