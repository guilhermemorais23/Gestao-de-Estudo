import React, { useState } from 'react'

function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mensagem, setMensagem] = useState('')

  const lidarComLogin = async (e) => {
    e.preventDefault() // Evita recarregar a tela

    const dadosLogin = { email, senha }

    try {
      // 1. aponta para a rota correta de LOGIN
      const resposta = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosLogin),
      })

      const dadosDaResposta = await resposta.json()

      if (resposta.ok) {
        
        setMensagem(`Sucesso: Bem-vindo(a), ${dadosDaResposta.user.name}!`)
        setEmail('')
        setSenha('')
        
        
        console.log('Dados do usuário logado:', dadosDaResposta.user)
      } else {
       
        setMensagem(`Erro: ${dadosDaResposta.detail}`)
      }
    } catch (error) {
      setMensagem('Erro ao conectar com o servidor.')
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Acessar Sistema</h2>
      
      <form onSubmit={lidarComLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label>E-mail:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Senha:</label>
          <input 
            type="password" 
            value={senha} 
            onChange={(e) => setSenha(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Entrar
        </button>
      </form>

      {mensagem && <p style={{ marginTop: '15px', color: mensagem.startsWith('Sucesso') ? 'green' : 'red' }}>{mensagem}</p>}
    </div>
  )
}

export default Login