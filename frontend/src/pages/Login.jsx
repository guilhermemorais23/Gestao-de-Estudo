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
      <aside className="login-lado">
        <div className="marca claro">
          <span className="marca-simbolo" aria-hidden="true" />
          Prospecta
        </div>
        <div className="login-frase">
          <p className="login-titulo">Todo negócio do bairro merece ser encontrado no Google.</p>
          <p>Ache as empresas de João Pessoa que ainda não têm site, mande a primeira mensagem e acompanhe cada conversa até o fechamento.</p>
        </div>
        <ul className="login-passos" aria-label="Como funciona">
          <li><b>Buscar</b><span>empresas sem site no Maps</span></li>
          <li><b>Abordar</b><span>pelo WhatsApp, com mensagem pronta</span></li>
          <li><b>Mostrar</b><span>uma prévia do site feita com as respostas do cliente</span></li>
        </ul>
      </aside>
      <main className="login-form-area">
        <form className="login" onSubmit={enviar}>
          <div>
            <h1>{modo === 'login' ? 'Entrar' : 'Criar conta'}</h1>
            <p className="muted">{modo === 'login' ? 'Use o e-mail e a senha da sua conta.' : 'O primeiro cadastro vira a conta administradora.'}</p>
          </div>
          {DEMO && <p className="faixa-info caixa">Demonstração com dados de exemplo. É só clicar em Entrar.</p>}
          {modo === 'registro' && (
            <label htmlFor="nome">Nome<input id="nome" value={form.nome} onChange={set('nome')} required minLength={2} /></label>
          )}
          <label htmlFor="email">E-mail<input id="email" type="email" value={form.email} onChange={set('email')} required /></label>
          <label htmlFor="senha">Senha<input id="senha" type="password" value={form.senha} onChange={set('senha')} required minLength={6} /></label>
          {erro && <p className="erro">{erro}</p>}
          <button className="btn grande" disabled={carregando}>
            {carregando ? 'Entrando' : modo === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
          <button type="button" className="btn-texto" onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}>
            {modo === 'login' ? 'Primeiro acesso? Criar conta' : 'Já tenho conta'}
          </button>
        </form>
      </main>
    </div>
  )
}
