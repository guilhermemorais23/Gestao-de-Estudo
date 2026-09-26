import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEMO, api, salvarToken } from '../api'

export default function Login() {
  const [modo, setModo] = useState('login')
  const [form, setForm] = useState(
    DEMO ? { nome: '', email: 'demo@prospecta.pb', senha: 'demo123' } : { nome: '', email: '', senha: '' },
  )
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const navigate = useNavigate()

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      const rota = modo === 'login' ? '/auth/login' : '/auth/registro'
      const corpo = modo === 'login' ? { email: form.email, senha: form.senha } : form
      const { token } = await api(rota, { method: 'POST', body: corpo })
      salvarToken(token)
      navigate('/prospectar')
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="tela-login">
      <form className="card login" onSubmit={enviar}>
        <h1>🔎 Prospecta PB</h1>
        <p className="muted">Encontre empresas sem site e transforme em clientes.</p>
        {DEMO && <p className="aviso-demo">Demonstração com dados de exemplo. É só clicar em Entrar.</p>}
        {modo === 'registro' && (
          <label>Nome<input value={form.nome} onChange={set('nome')} required minLength={2} /></label>
        )}
        <label>E-mail<input type="email" value={form.email} onChange={set('email')} required /></label>
        <label>Senha<input type="password" value={form.senha} onChange={set('senha')} required minLength={6} /></label>
        {erro && <p className="erro">{erro}</p>}
        <button className="btn" disabled={carregando}>
          {carregando ? 'Aguarde…' : modo === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
        <button type="button" className="btn-link" onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}>
          {modo === 'login' ? 'Primeiro acesso? Criar conta' : 'Já tenho conta'}
        </button>
      </form>
    </div>
  )
}
