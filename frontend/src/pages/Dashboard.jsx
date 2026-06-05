import React, { useState } from 'react'

function Dashboard() {
  // Simulando que pegamos o ID do usuário que logou. Vamos usar o ID 1 que você acabou de alterar!
  const usuarioId = 2

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('user@example.com')
  const [mensagem, setMensagem] = useState('')

  // Função para salvar a alteração (PUT)
  const atualizarDados = async () => {
    try {
     
      const resposta = await fetch(`http://localhost:8000/auth/usuario/${usuarioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nome, email: email }) // Manda o molde que o Python espera
      })

      const dados = await resposta.json()
      if (resposta.ok) {
        setMensagem('Usuário atualizado com sucesso no banco!')
      } else {
        setMensagem(`Erro: ${dados.detail}`)
      }
    } catch (error) {
      setMensagem('Erro ao conectar com o servidor.')
    }
  }

  // Função para deletar a conta (DELETE)
  const deletarConta = async () => {
    if (window.confirm("Tem certeza absoluta que quer apagar sua conta?")) {
      try {
        const resposta = await fetch(`http://localhost:8000/auth/usuario/${usuarioId}`, {
          method: 'DELETE' // Método exclusivo de deleção
        })

        const dados = await resposta.json()
        if (resposta.ok) {
          setMensagem('Conta excluída com sucesso! Sumiu do banco.')
          setNome('')
          setEmail('')
        } else {
          setMensagem(`Erro: ${dados.detail}`)
        }
      } catch (error) {
        setMensagem('Erro ao conectar.')
      }
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Painel do Usuário (CRUD)</h2>
      
      <div style={{ marginBottom: '15px' }}>
        <label>Nome no Sistema:</label>
        <input 
          type="text" 
          value={nome} 
          onChange={(e) => setNome(e.target.value)} 
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>E-mail no Sistema:</label>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        />
      </div>

      <button onClick={atualizarDados} style={{ width: '100%', padding: '10px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold' }}>
        Salvar Alterações (PUT)
      </button>

      <button onClick={deletarConta} style={{ width: '100%', padding: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
        Excluir Minha Conta (DELETE)
      </button>

      {mensagem && <p style={{ marginTop: '15px', color: 'blue', fontWeight: 'bold' }}>{mensagem}</p>}
    </div>
  )
}

export default Dashboard