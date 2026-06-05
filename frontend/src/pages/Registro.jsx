import React, { useState } from 'react'

function Registro() {
  // O useState é o "Estado" do React. Ele serve para guardar o que o usuário digita nos inputs.
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mensagem, setMensagem] = useState('')

  // Essa função vai rodar quando o usuário clicar no botão de cadastrar
  const lidarComEnvio = async (e) => {
    e.preventDefault() // Evita que a página recarregue ao enviar o formulário

    // Criamos o objeto exatamente no formato que o nosso FastAPI espera receber (RegistroUsuario)
    const dadosUsuario = { name, email, senha }

    try {
      // Fazemos a chamada para a nossa API do Python usando o fetch
      const resposta = await fetch('http://localhost:8000/auth/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosUsuario), // Transforma o objeto JavaScript em texto JSON
      })

      const dadosDaResposta = await resposta.json()

      if (resposta.ok) {
        setMensagem(`Sucesso: ${dadosDaResposta.message}`)
        // Limpa os campos após o sucesso
        setName('')
        setEmail('')
        setSenha('')
      } else {
        // Se a API devolver erro (como e-mail duplicado), exibe a mensagem de erro
        setMensagem(`Erro: ${dadosDaResposta.detail}`)
      }
    } catch (error) {
      setMensagem('Erro ao conectar com o servidor.')
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Criar Conta</h2>
      
      <form onSubmit={lidarComEnvio}>
        <div style={{ marginBottom: '15px' }}>
          <label>Nome:</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} // Atualiza o estado 'name' a cada letra digitada
            required 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

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

        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Cadastrar
        </button>
      </form>

      {/* Exibe a mensagem de sucesso ou erro na tela se ela existir */}
      {mensagem && <p style={{ marginTop: '15px', color: mensagem.startsWith('Sucesso') ? 'green' : 'red' }}>{mensagem}</p>}
    </div>
  )
}

export default Registro