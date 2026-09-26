// Modo demonstração: simula o backend no navegador, com dados de exemplo.
// Ativado com `npm run build:demo` (VITE_DEMO=1).

import MODELOS from './modelos.json'

let seq = 100
const tok = () => Math.random().toString(36).slice(2, 11)
const agora = () => new Date().toISOString().replace('Z', '')

const usuario = {
  id: 1, nome: 'Guilherme', email: 'demo@prospecta.pb', empresa: 'GM Sites', whatsapp: '5583999990000',
  token_publico: 'geral', modelos: structuredClone(MODELOS),
}

const diasAtras = (n) => new Date(Date.now() - n * 86400000).toISOString().replace('Z', '')

function lead(d) {
  return {
    id: ++seq, fonte: 'google', regiao: 'pb', idioma: 'pt', cidade: 'João Pessoa - PB', website: '',
    so_rede_social: false, status: 'novo', notas: '', token: tok(), criado_em: agora(),
    maps_url: 'https://www.google.com/maps', tom: Math.random() < 0.5 ? 'formal' : 'descontraido',
    passo: 0, ultimo_envio_em: null, respondeu: false, respondeu_no_passo: null, questionario_enviado: false, ...d,
  }
}

let leads = [
  lead({ nome: 'Barbearia Cabo Branco (exemplo)', categoria: 'Barbearia', endereco: 'Av. Cabo Branco, Cabo Branco', telefone: '(83) 99812-4410', whatsapp: '5583998124410', whatsapp_provavel: true, avaliacao: 4.9, num_avaliacoes: 214, score: 95 }),
  lead({ nome: 'Studio Bella Estética (exemplo)', categoria: 'Clínica de estética', endereco: 'Av. Gov. Flávio Ribeiro Coutinho, Manaíra', telefone: '(83) 98111-2233', whatsapp: '5583981112233', whatsapp_provavel: true, website: 'https://instagram.com/studiobella', so_rede_social: true, avaliacao: 4.6, num_avaliacoes: 88, score: 77, status: 'contatado', notas: 'Dona pediu pra chamar depois das 18h', tom: 'descontraido', passo: 1, ultimo_envio_em: diasAtras(3) }),
  lead({ nome: 'Pet Amigo Bancários (exemplo)', categoria: 'Pet shop', endereco: 'R. Bancário Sérgio Guerra, Bancários', telefone: '(83) 3222-4455', whatsapp: '558332224455', whatsapp_provavel: false, avaliacao: 4.2, num_avaliacoes: 40, score: 45, tom: 'formal', passo: 2, ultimo_envio_em: diasAtras(5) }),
  lead({ nome: 'Oficina do Tonho (exemplo)', categoria: 'Oficina mecânica', endereco: 'Av. Dois de Fevereiro, Rangel', telefone: '(83) 98870-1122', whatsapp: '5583988701122', whatsapp_provavel: true, avaliacao: 4.7, num_avaliacoes: 131, score: 92, status: 'questionario', tom: 'descontraido', passo: 1, ultimo_envio_em: diasAtras(2), respondeu: true, respondeu_no_passo: 1, questionario_enviado: true }),
  lead({ nome: 'Sabor da Praia Restaurante (exemplo)', categoria: 'Restaurante', endereco: 'Av. Almirante Tamandaré, Tambaú', telefone: '(83) 99654-7788', whatsapp: '5583996547788', whatsapp_provavel: true, website: 'https://instagram.com/sabordapraia', so_rede_social: true, avaliacao: 4.4, num_avaliacoes: 402, score: 85, status: 'proposta', tom: 'formal', passo: 2, ultimo_envio_em: diasAtras(6), respondeu: true, respondeu_no_passo: 2, questionario_enviado: true }),
  lead({ nome: 'Clínica Sorriso Bessa (exemplo)', categoria: 'Dentista', endereco: 'Av. Argemiro de Figueiredo, Bessa', telefone: '(83) 99301-5566', whatsapp: '5583993015566', whatsapp_provavel: true, avaliacao: 5.0, num_avaliacoes: 67, score: 91, status: 'fechado', notas: 'Landing page + agendamento. R$ 1.200', tom: 'descontraido', passo: 1, ultimo_envio_em: diasAtras(12), respondeu: true, respondeu_no_passo: 1, questionario_enviado: true }),
  lead({ nome: 'Sunny Nails Studio (example)', categoria: 'Nail salon', endereco: 'Brickell, Miami, FL', cidade: 'Miami, USA', regiao: 'exterior', idioma: 'en', telefone: '+1 305-555-0142', whatsapp: '13055550142', whatsapp_provavel: true, avaliacao: 4.8, num_avaliacoes: 156, score: 88 }),
]

// Histórico fictício de 3 semanas de abordagens, para a aba Resultados ter números
const SEGMENTOS = ['Salão', 'Academia', 'Lanchonete', 'Ótica', 'Clínica', 'Pizzaria', 'Pet shop', 'Estúdio de tatuagem']
const BAIRROS = ['Manaíra', 'Tambaú', 'Bessa', 'Mangabeira', 'Bancários', 'Torre', 'Altiplano', 'Cristo', 'Jaguaribe', 'Valentina']
for (let i = 0; i < 70; i++) {
  const tom = i % 2 ? 'formal' : 'descontraido'
  const sorte = (i * 37) % 100
  const chanceResp = tom === 'descontraido' ? 22 : 13
  const respondeu = sorte < chanceResp
  const passo = respondeu ? 1 + (i % 3 === 0 ? 1 : 0) : 1 + (i % 3)
  const fezQuest = respondeu && sorte < chanceResp * 0.55
  const fechou = fezQuest && i % 4 === 0
  leads.push(lead({
    nome: `${SEGMENTOS[i % SEGMENTOS.length]} ${BAIRROS[i % BAIRROS.length]} (exemplo)`,
    categoria: SEGMENTOS[i % SEGMENTOS.length], endereco: `${BAIRROS[i % BAIRROS.length]}, João Pessoa`,
    telefone: `(83) 9${8000 + i}-${1000 + i}`, whatsapp: `55839${8000 + i}${1000 + i}`, whatsapp_provavel: true,
    avaliacao: +(4 + (i % 10) / 10).toFixed(1), num_avaliacoes: 10 + ((i * 13) % 150), score: 50 + ((i * 7) % 45),
    tom, passo, respondeu, respondeu_no_passo: respondeu ? passo : null, questionario_enviado: respondeu && sorte % 3 !== 0,
    ultimo_envio_em: diasAtras(1 + (i % 9)),
    status: fechou ? 'fechado' : fezQuest ? 'questionario' : respondeu ? 'respondeu' : passo === 3 && i % 5 === 0 ? 'perdido' : 'contatado',
  }))
}

let briefings = [
  {
    id: 1, lead_id: leads[3].id, token: 'oficina', empresa: 'Oficina do Tonho', contato_nome: 'Antônio',
    contato_whatsapp: '5583988701122', lido: false, criado_em: agora(),
    respostas: {
      _idioma: 'pt', empresa: 'Oficina do Tonho', contato_nome: 'Antônio', contato_whatsapp: '83 98870-1122',
      segmento: 'Oficina mecânica', servicos: 'Revisão completa\nTroca de óleo\nFreios e suspensão\nAr-condicionado automotivo',
      diferencial: '25 anos de experiência e orçamento na hora pelo WhatsApp',
      objetivo: 'Mais clientes chamando no WhatsApp (landing page)',
      recursos: ['Botão de WhatsApp', 'Mapa e endereço', 'Depoimentos de clientes'],
      tem_logo: 'Não', cores: 'azul e laranja', endereco: 'Av. Dois de Fevereiro, Rangel, João Pessoa',
      horario: 'Seg a Sex 8h–18h, Sáb 8h–12h', prazo: 'Este mês', investimento: 'R$ 500 a R$ 1.500',
    },
  },
]

const NOMES = ['Central', 'Tambaú', 'Manaíra', 'do Bessa', 'Cabo Branco', 'Bancários', 'Mangabeira', 'Altiplano', 'Jaguaribe', 'Torre', 'Cristo', 'Valentina']

function simularBusca(corpo) {
  const qtd = 6 + Math.floor(Math.random() * 6)
  const termo = corpo.termo.charAt(0).toUpperCase() + corpo.termo.slice(1)
  const novos = []
  for (let i = 0; i < qtd; i++) {
    const cel = Math.random() > 0.25
    const social = corpo.incluir_so_rede_social && Math.random() > 0.7
    const avals = Math.floor(Math.random() ** 2 * 160)
    const nota = +(3.8 + Math.random() * 1.2).toFixed(1)
    const num = `9${Math.floor(1000 + Math.random() * 8999)}${Math.floor(1000 + Math.random() * 8999)}`
    let score = (social ? 25 : 35) + 15 + (cel ? 15 : 0) + Math.min(25, Math.floor(avals / 4)) + (nota >= 4.3 ? 10 : 0)
    novos.push(lead({
      nome: `${termo} ${NOMES[(i + seq) % NOMES.length]} (exemplo)`, categoria: termo,
      endereco: corpo.cidade, cidade: corpo.cidade, regiao: corpo.regiao, idioma: corpo.idioma,
      fonte: corpo.fonte, telefone: cel ? `(83) ${num.slice(0, 5)}-${num.slice(5)}` : '(83) 3241-0000',
      whatsapp: cel ? `5583${num}` : '558332410000', whatsapp_provavel: cel,
      website: social ? 'https://instagram.com/exemplo' : '', so_rede_social: social,
      avaliacao: nota, num_avaliacoes: avals, score: Math.min(100, score),
    }))
  }
  leads = [...novos, ...leads]
  return {
    total_encontrado: qtd + 4 + Math.floor(Math.random() * 8), sem_site: qtd, novos: qtd,
    leads: [...novos].sort((a, b) => b.score - a.score),
  }
}

function pendente(l) {
  if (l.respondeu || ['fechado', 'perdido'].includes(l.status) || !l.ultimo_envio_em) return false
  const dias = (Date.now() - new Date(l.ultimo_envio_em + 'Z').getTime()) / 86400000
  return (l.passo === 1 && dias >= 2) || (l.passo === 2 && dias >= 4)
}

function funil(g) {
  const conta = (f) => g.filter(f).length
  return {
    contatados: g.length,
    responderam: conta((l) => l.respondeu),
    respondeu_no_passo: { 1: conta((l) => l.respondeu_no_passo === 1), 2: conta((l) => l.respondeu_no_passo === 2), 3: conta((l) => l.respondeu_no_passo === 3) },
    questionario_enviado: conta((l) => l.questionario_enviado),
    questionario_respondido: conta((l) => ['questionario', 'proposta', 'fechado'].includes(l.status)),
    proposta: conta((l) => ['proposta', 'fechado'].includes(l.status)),
    fechados: conta((l) => l.status === 'fechado'),
    parou_sem_resposta: { 1: conta((l) => !l.respondeu && l.passo === 1), 2: conta((l) => !l.respondeu && l.passo === 2), 3: conta((l) => !l.respondeu && l.passo === 3) },
  }
}

function alterar(id, fn) {
  const l = leads.find((x) => x.id === id)
  fn(l)
  return { ...l }
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms))

export async function mockApi(caminho, method, body) {
  await espera(caminho.includes('buscar') ? 900 : 120)
  const [rota, query] = caminho.split('?')
  const params = new URLSearchParams(query || '')
  const partes = rota.split('/').filter(Boolean)

  if (rota === '/auth/login' || rota === '/auth/registro') return { token: 'demo', usuario }
  if (rota === '/auth/eu') return { ...usuario }
  if (rota === '/auth/config') {
    Object.assign(usuario, body, { whatsapp: (body.whatsapp || '').replace(/\D/g, '') })
    return { ...usuario }
  }

  if (rota === '/leads/buscar') return simularBusca(body)
  if (rota === '/leads/resumo') {
    const r = leads.reduce((acc, l) => ({ ...acc, [l.status]: (acc[l.status] || 0) + 1 }), {})
    return { ...r, _pendentes: leads.filter(pendente).length }
  }
  if (rota === '/leads/metricas') {
    const contatados = leads.filter((l) => l.passo > 0)
    return {
      geral: funil(contatados),
      formal: funil(contatados.filter((l) => l.tom === 'formal')),
      descontraido: funil(contatados.filter((l) => l.tom === 'descontraido')),
    }
  }
  if (rota === '/leads' && method === 'GET') {
    const q = (params.get('q') || '').toLowerCase()
    return leads
      .filter((l) => !params.get('status') || l.status === params.get('status'))
      .filter((l) => !params.get('pendentes') || pendente(l))
      .filter((l) => !params.get('regiao') || l.regiao === params.get('regiao'))
      .filter((l) => !q || `${l.nome} ${l.categoria} ${l.endereco}`.toLowerCase().includes(q))
      .sort((a, b) => b.score - a.score)
  }
  if (rota === '/leads' && method === 'POST') {
    const wa = body.telefone.replace(/\D/g, '')
    const novo = lead({ ...body, fonte: 'manual', whatsapp: wa ? `55${wa}` : '', whatsapp_provavel: wa.length === 11, score: 50 })
    leads = [novo, ...leads]
    return novo
  }
  if (partes[0] === 'leads' && partes[2] === 'envio') {
    return alterar(Number(partes[1]), (l) => {
      if (body.passo === 'questionario') {
        l.questionario_enviado = true
        if (!l.respondeu) Object.assign(l, { respondeu: true, respondeu_no_passo: l.passo || 1 })
      } else {
        l.passo = Math.max(l.passo, { abertura: 1, retorno1: 2, retorno2: 3 }[body.passo])
        if (l.status === 'novo') l.status = 'contatado'
      }
      l.ultimo_envio_em = agora()
    })
  }
  if (partes[0] === 'leads' && partes[2] === 'resposta') {
    return alterar(Number(partes[1]), (l) => {
      if (l.respondeu) {
        Object.assign(l, { respondeu: false, respondeu_no_passo: null })
        if (l.status === 'respondeu') l.status = 'contatado'
      } else {
        Object.assign(l, { respondeu: true, respondeu_no_passo: l.passo || 1 })
        if (['novo', 'contatado'].includes(l.status)) l.status = 'respondeu'
      }
    })
  }
  if (partes[0] === 'leads') {
    const id = Number(partes[1])
    if (method === 'DELETE') {
      leads = leads.filter((l) => l.id !== id)
      return { ok: true }
    }
    leads = leads.map((l) => (l.id === id ? { ...l, ...body } : l))
    return leads.find((l) => l.id === id)
  }

  if (rota === '/briefings') return briefings
  if (partes[0] === 'briefings') {
    briefings = briefings.map((b) => (b.id === Number(partes[1]) ? { ...b, lido: true } : b))
    return { ok: true }
  }

  if (partes[0] === 'publico' && partes[1] === 'q') {
    const l = leads.find((x) => x.token === partes[2])
    if (method === 'GET') {
      return { vendedor: usuario.nome, empresa_vendedor: usuario.empresa, empresa_cliente: l ? l.nome : '', idioma: l ? l.idioma : 'pt' }
    }
    const b = {
      id: ++seq, lead_id: l ? l.id : null, token: tok(), empresa: body.empresa, contato_nome: body.contato_nome,
      contato_whatsapp: (body.contato_whatsapp || '').replace(/\D/g, ''), respostas: body.respostas, lido: false, criado_em: agora(),
    }
    briefings = [b, ...briefings]
    if (l) {
      if (!l.respondeu) Object.assign(l, { respondeu: true, respondeu_no_passo: l.passo || 1 })
      if (['novo', 'contatado', 'respondeu'].includes(l.status)) l.status = 'questionario'
    }
    return { token: b.token, whatsapp_vendedor: usuario.whatsapp }
  }
  if (partes[0] === 'publico' && partes[1] === 'lp') {
    const b = briefings.find((x) => x.token === partes[2])
    if (!b) throw new Error('Prévia não encontrada')
    return { briefing: b, vendedor: { nome: usuario.nome, empresa: usuario.empresa, whatsapp: usuario.whatsapp } }
  }
  throw new Error(`Rota de demonstração não encontrada: ${rota}`)
}
