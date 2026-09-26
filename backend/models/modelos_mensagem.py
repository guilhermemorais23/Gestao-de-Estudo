"""Modelos de mensagem de abordagem.

Cada lead recebe um tom sorteado (formal ou descontraído) para comparar qual converte mais.
Passos da sequência:
  abertura      1ª mensagem, curta e sem link, termina em pergunta
  questionario  só depois que a pessoa responde: manda o link do questionário
  retorno1      2 a 3 dias sem resposta: traz um argumento novo
  retorno2      5 a 7 dias sem resposta: encerra com educação

Campos que podem ser usados no texto:
  {saudacao} Bom dia / Boa tarde / Boa noite      {empresa} nome do lead
  {meu_nome} {minha_empresa}                      {categoria} ex.: barbearia
  {nota_texto} " com nota 4,9 em 214 avaliações" (vazio se não tiver)
  {link} link do questionário
"""

PASSOS = ["abertura", "questionario", "retorno1", "retorno2"]
TONS = ["formal", "descontraido"]

MODELOS_PADRAO = {
    "pt": {
        "formal": {
            "abertura": (
                "{saudacao}! Meu nome é {meu_nome}{minha_empresa}, trabalho com criação de sites aqui em "
                "João Pessoa. Encontrei a {empresa} no Google Maps{nota_texto} e notei que vocês ainda não "
                "têm um site. Posso enviar uma sugestão de como ficaria? Sem compromisso."
            ),
            "questionario": (
                "Obrigado pelo retorno! Para montar a prévia, preciso de algumas informações. "
                "Leva cerca de 2 minutos: {link}\n\nAssim que responder, envio a prévia no mesmo dia."
            ),
            "retorno1": (
                "{saudacao}! Complementando minha mensagem: hoje a maioria dos clientes pesquisa no Google "
                "antes de escolher {categoria}. Com um site, a {empresa} aparece melhor nessas buscas e "
                "recebe contatos direto no WhatsApp. Se tiver interesse, preparo uma prévia gratuita."
            ),
            "retorno2": (
                "{saudacao}! Para não incomodar, esta é minha última mensagem. Se em algum momento "
                "quiserem um site, fico à disposição. Sucesso!"
            ),
        },
        "descontraido": {
            "abertura": (
                "Oi, tudo bem? Sou o {meu_nome}, faço sites aqui em João Pessoa. Vi a {empresa} no "
                "Google{nota_texto}. Só senti falta de um site pra galera ver os serviços e chamar vocês "
                "direto. Posso te mandar uma ideia de como ficaria? Sem compromisso."
            ),
            "questionario": (
                "Massa! Responde essas perguntinhas aqui, leva uns 2 minutos, que eu monto a prévia do "
                "site de vocês e te mando ainda hoje: {link}"
            ),
            "retorno1": (
                "Oi! Voltando aqui rapidinho: quem procura {categoria} no Google geralmente escolhe quem "
                "tem site com foto, preço e WhatsApp. Quer que eu monte uma prévia pra {empresa}? "
                "É de graça."
            ),
            "retorno2": (
                "Vou parar de te encher por aqui, prometo! Se um dia quiserem um site, é só me chamar. "
                "Sucesso aí!"
            ),
        },
    },
    "en": {
        "formal": {
            "abertura": (
                "Hi! I'm {meu_nome}{minha_empresa}, I build websites for small businesses. I found "
                "{empresa} on Google Maps{nota_texto} and noticed you don't have a website yet. "
                "Would you like me to send you a free mockup? No strings attached."
            ),
            "questionario": (
                "Thanks for getting back to me! To build the mockup I need a few details. "
                "It takes about 2 minutes: {link}"
            ),
            "retorno1": (
                "Hi again! Most customers search Google before choosing {categoria}. A simple website "
                "helps {empresa} show up and get messages straight to WhatsApp. Happy to send a free mockup."
            ),
            "retorno2": "This is my last message, I don't want to bother you. If you ever need a website, just let me know!",
        },
    },
    "es": {
        "formal": {
            "abertura": (
                "¡Hola! Soy {meu_nome}{minha_empresa}, hago sitios web para pequeñas empresas. Encontré "
                "{empresa} en Google Maps{nota_texto} y vi que todavía no tienen sitio web. "
                "¿Te envío una propuesta de cómo quedaría? Sin compromiso."
            ),
            "questionario": (
                "¡Gracias por responder! Para armar la vista previa necesito algunos datos. "
                "Son 2 minutos: {link}"
            ),
            "retorno1": (
                "¡Hola de nuevo! La mayoría de los clientes busca en Google antes de elegir {categoria}. "
                "Un sitio simple ayuda a {empresa} a aparecer y recibir mensajes directo por WhatsApp. "
                "¿Te preparo una vista previa gratis?"
            ),
            "retorno2": "Este es mi último mensaje para no molestar. Si algún día necesitan un sitio web, ¡me escriben!",
        },
    },
}
