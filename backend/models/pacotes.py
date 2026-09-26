"""Pacotes padrão da proposta. Você edita preços e itens em Configurações."""

PACOTE_GOOGLE = {
    "id": "google",
    "nome": "Otimização do Google",
    "preco": 250,
    "mensalidade": 0,
    "prazo_dias": 3,
    "descricao": "Deixa o perfil da empresa no Google Maps completo para aparecer melhor nas buscas do bairro.",
    "itens": [
        "Descrição completa com os serviços",
        "Horários, categorias e área de atendimento revisados",
        "Fotos organizadas",
        "Link direto para o WhatsApp",
        "Estratégia simples para ganhar mais avaliações",
    ],
}

PACOTES_PADRAO = [
    {
        "id": "landing",
        "nome": "Landing page",
        "preco": 650,
        "mensalidade": 0,
        "prazo_dias": 5,
        "descricao": "Uma página completa para o cliente conhecer seu negócio e chamar no WhatsApp.",
        "itens": [
            "Página única, feita para celular",
            "Botão de WhatsApp em todas as seções",
            "Fotos, serviços, horário e mapa",
            "Domínio .com.br no primeiro ano",
            "2 rodadas de ajustes",
        ],
    },
    {
        "id": "landing_manutencao",
        "nome": "Landing page com manutenção",
        "preco": 550,
        "mensalidade": 100,
        "prazo_dias": 5,
        "descricao": "A landing page mais hospedagem, domínio e alterações todo mês. Você não fica na mão.",
        "itens": [
            "Tudo da landing page",
            "Hospedagem e domínio inclusos",
            "Alterações de preço, foto e texto sempre que precisar",
            "Suporte pelo WhatsApp",
        ],
        "recomendado": True,
    },
    {
        "id": "site",
        "nome": "Site completo",
        "preco": 1200,
        "mensalidade": 100,
        "prazo_dias": 12,
        "descricao": "Site com várias páginas para quem tem muitos serviços ou quer aparecer melhor no Google.",
        "itens": [
            "Até 5 páginas",
            "Galeria de fotos e página de serviços",
            "Otimização básica para o Google",
            "Hospedagem, domínio e alterações todo mês",
        ],
    },
    PACOTE_GOOGLE,
]
