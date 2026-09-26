// Roteiro do questionário (briefing) que o cliente responde.
// As respostas alimentam a prévia da landing page e a sua proposta.

export const TEXTOS = {
  pt: {
    titulo: 'Vamos montar o site da sua empresa',
    sub: 'Responda em 2 minutos e receba uma prévia gratuita.',
    enviar: 'Ver minha prévia', enviando: 'Enviando…',
    obrigado: 'Pronto! Recebemos suas respostas',
    verPrevia: 'Ver prévia do meu site', falar: 'Falar no WhatsApp',
    qrTexto: 'Está no computador? Escaneie com o celular:',
  },
  en: {
    titulo: "Let's build your business website",
    sub: 'Answer in 2 minutes and get a free preview.',
    enviar: 'See my preview', enviando: 'Sending…',
    obrigado: 'Done! We got your answers',
    verPrevia: 'See my website preview', falar: 'Chat on WhatsApp',
    qrTexto: 'On a computer? Scan with your phone:',
  },
  es: {
    titulo: 'Armemos el sitio web de tu empresa',
    sub: 'Responde en 2 minutos y recibe una vista previa gratis.',
    enviar: 'Ver mi vista previa', enviando: 'Enviando…',
    obrigado: '¡Listo! Recibimos tus respuestas',
    verPrevia: 'Ver vista previa de mi sitio', falar: 'Hablar por WhatsApp',
    qrTexto: '¿Estás en la computadora? Escanea con tu celular:',
  },
}

// tipo: texto | area | unica | multipla
export const PERGUNTAS = [
  { id: 'empresa', tipo: 'texto', obrigatoria: true,
    pt: 'Nome da empresa', en: 'Business name', es: 'Nombre de la empresa' },
  { id: 'contato_nome', tipo: 'texto', obrigatoria: true,
    pt: 'Seu nome', en: 'Your name', es: 'Tu nombre' },
  { id: 'contato_whatsapp', tipo: 'texto',
    pt: 'WhatsApp da empresa (com DDD)', en: 'Business WhatsApp (with country code)', es: 'WhatsApp de la empresa (con código de país)' },
  { id: 'segmento', tipo: 'texto', obrigatoria: true,
    pt: 'O que a sua empresa faz? (ex: barbearia, clínica, restaurante)',
    en: 'What does your business do?', es: '¿Qué hace tu empresa?' },
  { id: 'servicos', tipo: 'area',
    pt: 'Principais serviços ou produtos (um por linha)',
    en: 'Main services or products (one per line)', es: 'Principales servicios o productos (uno por línea)' },
  { id: 'diferencial', tipo: 'texto',
    pt: 'Por que os clientes escolhem vocês?', en: 'Why do customers choose you?', es: '¿Por qué te eligen los clientes?' },
  { id: 'objetivo', tipo: 'unica', obrigatoria: true,
    pt: 'O que você mais precisa agora?', en: 'What do you need most right now?', es: '¿Qué necesitas más ahora?',
    opcoes: {
      pt: ['Mais clientes chamando no WhatsApp (landing page)', 'Site completo da empresa', 'Loja online / cardápio digital', 'Sistema (agendamento, pedidos, controle)', 'Ainda não sei, quero orientação'],
      en: ['More customers on WhatsApp (landing page)', 'Full company website', 'Online store / digital menu', 'System (booking, orders, management)', "Not sure yet, I'd like advice"],
      es: ['Más clientes por WhatsApp (landing page)', 'Sitio web completo', 'Tienda online / menú digital', 'Sistema (reservas, pedidos, gestión)', 'Aún no sé, quiero orientación'],
    } },
  { id: 'recursos', tipo: 'multipla',
    pt: 'O que não pode faltar?', en: 'Must-have features', es: '¿Qué no puede faltar?',
    opcoes: {
      pt: ['Botão de WhatsApp', 'Mapa e endereço', 'Galeria de fotos', 'Cardápio / catálogo', 'Agendamento online', 'Depoimentos de clientes', 'Área de login para clientes', 'Pagamento online'],
      en: ['WhatsApp button', 'Map & address', 'Photo gallery', 'Menu / catalog', 'Online booking', 'Customer reviews', 'Customer login area', 'Online payment'],
      es: ['Botón de WhatsApp', 'Mapa y dirección', 'Galería de fotos', 'Menú / catálogo', 'Reservas online', 'Testimonios', 'Área de clientes con login', 'Pago online'],
    } },
  { id: 'tem_logo', tipo: 'unica',
    pt: 'Vocês já têm logo?', en: 'Do you have a logo?', es: '¿Tienen logo?',
    opcoes: { pt: ['Sim', 'Não', 'Tenho, mas quero melhorar'], en: ['Yes', 'No', 'Yes, but want to improve it'], es: ['Sí', 'No', 'Sí, pero quiero mejorarlo'] } },
  { id: 'cores', tipo: 'texto',
    pt: 'Cores da marca (ex: preto e dourado)', en: 'Brand colors (e.g. black and gold)', es: 'Colores de la marca (ej: negro y dorado)' },
  { id: 'instagram', tipo: 'texto', pt: 'Instagram (@)', en: 'Instagram (@)', es: 'Instagram (@)' },
  { id: 'endereco', tipo: 'texto', pt: 'Endereço', en: 'Address', es: 'Dirección' },
  { id: 'horario', tipo: 'texto', pt: 'Horário de funcionamento', en: 'Opening hours', es: 'Horario' },
  { id: 'prazo', tipo: 'unica',
    pt: 'Para quando você precisa?', en: 'When do you need it?', es: '¿Para cuándo lo necesitas?',
    opcoes: { pt: ['Urgente (até 1 semana)', 'Este mês', 'Sem pressa'], en: ['Urgent (within a week)', 'This month', 'No rush'], es: ['Urgente (1 semana)', 'Este mes', 'Sin prisa'] } },
  { id: 'investimento', tipo: 'unica',
    pt: 'Quanto pretende investir?', en: 'Expected budget', es: '¿Cuánto piensas invertir?',
    opcoes: {
      pt: ['Até R$ 500', 'R$ 500 a R$ 1.500', 'R$ 1.500 a R$ 3.000', 'Acima de R$ 3.000', 'Quero ver a proposta primeiro'],
      en: ['Up to US$ 300', 'US$ 300 – 800', 'US$ 800 – 2,000', 'Above US$ 2,000', "I'd like to see a proposal first"],
      es: ['Hasta US$ 300', 'US$ 300 – 800', 'US$ 800 – 2.000', 'Más de US$ 2.000', 'Quiero ver la propuesta primero'],
    } },
]

export function resumoTexto(respostas, idioma = 'pt') {
  return PERGUNTAS.filter((p) => respostas[p.id] && (Array.isArray(respostas[p.id]) ? respostas[p.id].length : true))
    .map((p) => `• ${p[idioma] || p.pt}: ${[].concat(respostas[p.id]).join(', ')}`)
    .join('\n')
}
