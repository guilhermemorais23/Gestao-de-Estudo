import { mockApi } from './demo/mockApi'

const BASE = import.meta.env.VITE_API_URL || ''
export const DEMO = import.meta.env.VITE_DEMO === '1'

// Endereço público de uma página (questionário /q, prévia /lp)
export function urlPublica(caminho) {
  return DEMO ? `${window.location.href.split('#')[0]}#${caminho}` : `${window.location.origin}${caminho}`
}

let tokenMemoria = null

export function getToken() {
  try {
    return localStorage.getItem('token') || tokenMemoria
  } catch {
    return tokenMemoria
  }
}

export function salvarToken(token) {
  tokenMemoria = token
  try {
    localStorage.setItem('token', token)
  } catch {
    // navegador sem armazenamento: fica só na memória
  }
}

export function sair() {
  tokenMemoria = null
  try {
    localStorage.removeItem('token')
  } catch {
    // ignora
  }
  if (DEMO) window.location.hash = '#/login'
  else window.location.href = '/login'
}

export async function api(caminho, { method = 'GET', body } = {}) {
  if (DEMO) return mockApi(caminho, method, body)
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const resp = await fetch(`${BASE}/api${caminho}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (resp.status === 401 && token && !caminho.startsWith('/auth/login')) {
    sair()
    return
  }
  const dados = await resp.json().catch(() => ({}))
  if (!resp.ok) {
    const detalhe = Array.isArray(dados.detail)
      ? dados.detail.map((d) => d.msg).join(', ')
      : dados.detail
    throw new Error(detalhe || `Erro ${resp.status}`)
  }
  return dados
}

// Link do WhatsApp (wa.me) com mensagem pronta
export function linkWhatsapp(numero, mensagem) {
  const digitos = (numero || '').replace(/\D/g, '')
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : ''
  return digitos ? `https://wa.me/${digitos}${texto}` : `https://wa.me/${texto}`
}
