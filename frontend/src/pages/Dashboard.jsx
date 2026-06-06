import React, { useState } from 'react'

function Dashboard() {
  // ID do usuário que logou
  const usuarioId = 3

  // Estados do CRUD de Usuário
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('user@example.com')
  const [mensagem, setMensagem] = useState('')

  // 📝 NOVOS ESTADOS: Para o controle de estudos
  const [materia, setMateria] = useState('')
  const [tempoMinutos, setTempoMinutos] = useState('')
  const [mensagemEstudo, setMensagemEstudo] = useState('')

  // Função para salvar a alteração do usuário (PUT)
  const atualizarDados = async () => {
    try {
      const resposta = await fetch(`http://localhost:8000/auth/usuario/${usuarioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nome, email: email })
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
          method: 'DELETE'
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

  // 🚀 NOVA FUNÇÃO: Envia a sessão de estudos para a API (POST)
  const registrarEstudo = async () => {
    if (!materia || !tempoMinutos) {
      setMensagemEstudo('Preencha todos os campos do estudo!')
      return
    }

    try {
      const resposta = await fetch(`http://localhost:8000/auth/usuario/${usuarioId}/estudo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materia: materia,
          tempo_minutos: parseInt(tempoMinutos) // Força o envio como número inteiro!
        })
      })

      const dados = await resposta.json()
      if (resposta.ok) {
        setMensagemEstudo(`Sucesso: Estudo de ${dados.materia} gravado!`)
        setMateria('') // Limpa o campo após salvar
        setTempoMinutos('') // Limpa o campo após salvar
      } else {
        setMensagemEstudo(`Erro: ${dados.detail}`)
      }
    } catch (error) {
      setMensagemEstudo('Erro ao conectar com o servidor de estudos.')
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'sans-serif' }}>
      
      {/* SEÇÃO 1: CRUD DO USUÁRIO */}
      <h2>Painel do Usuário (CRUD)</h2>
      
      <div style={{ marginBottom: '15px' }}>
        <label>Nome no Sistema:</label>
        <input 
          type="text" 
          value={nome} 
          onChange={(e) => setNome(e.target.value)} 
          style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>E-mail no Sistema:</label>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }}
        />
      </div>

      <button onClick={atualizarDados} style={{ width: '100%', padding: '10px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold' }}>
        Salvar Alterações (PUT)
      </button>

      <button onClick={deletarConta} style={{ width: '100%', padding: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
        Excluir Minha Conta (DELETE)
      </button>

      {mensagem && <p style={{ marginTop: '15px', color: 'blue', fontWeight: 'bold' }}>{mensagem}</p>}

      {/* 🛠️ SEÇÃO 2: NOVA ÁREA DE REGISTRO DE HORAS DE ESTUDO */}
      <hr style={{ margin: '30px 0', border: '0', borderTop: '1px solid #ccc' }} />

      <h2>Registrar Desempenho</h2>

      <div style={{ marginBottom: '15px' }}>
        <label>Matéria Estudada:</label>
        <input 
          type="text" 
          placeholder="Ex: React, Python, SQL" 
          value={materia} 
          onChange={(e) => setMateria(e.target.value)} 
          style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>Tempo (em minutos):</label>
        <input 
          type="number" 
          placeholder="Ex: 45, 60, 90" 
          value={tempoMinutos} 
          onChange={(e) => setTempoMinutos(e.target.value)} 
          style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }}
        />
      </div>

      <button onClick={registrarEstudo} style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
        Gravar Sessão de Estudo (POST)
      </button>

      {mensagemEstudo && <p style={{ marginTop: '15px', color: 'green', fontWeight: 'bold' }}>{mensagemEstudo}</p>}

    </div>
  )
}

export default Dashboard