const BASE = import.meta.env.VITE_API_URL || ''

export function getToken() {
  return localStorage.getItem('token')
}

export function sair() {
  localStorage.removeItem('token')
  window.location.href = '/login'
}

export async function api(caminho, { method = 'GET', body } = {}) {
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
