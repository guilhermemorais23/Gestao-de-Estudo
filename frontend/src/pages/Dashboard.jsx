import React, { useState, useEffect } from 'react'

function Dashboard() {
  const idArmazenado = localStorage.getItem("usuarioId")
  const usuarioId = (idArmazenado && idArmazenado !== "undefined") ? idArmazenado : 2

  // Estados do CRUD de Usuário
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('user@example.com')
  const [mensagem, setMensagem] = useState('')

  // Estados do Histórico de estudos
  const [materia, setMateria] = useState('')
  const [listaEstudos, setListaEstudos] = useState([])

  // 🔥 ESTADOS NOVOS DO CRONÔMETRO INTERATIVO
  const [tempoInput, setTempoInput] = useState('') // Tempo que o usuário digita (em minutos)
  const [pausaInput, setPausaInput] = useState('') // Tempo de descanso (em minutos)
  const [segundosRestantes, setSegundosRestantes] = useState(0)
  const [timerAtivo, setTimerAtivo] = useState(false)
  const [modoAtual, setModoAtual] = useState('Foco') // 'Foco' ou 'Pausa'
  const [mensagemEstudo, setMensagemEstudo] = useState('')

  // Busca os estudos do banco de dados (GET)
  const buscarEstudos = async () => {
    try {
      const resposta = await fetch(`http://localhost:8000/auth/usuario/${usuarioId}/estudos`)
      const dados = await resposta.json()
      if (resposta.ok) setListaEstudos(dados)
    } catch (error) {
      console.error('Erro ao buscar estudos:', error)
    }
  }

  useEffect(() => {
    buscarEstudos()
  }, [])

  // ⏱️ EFEITO QUE FAZ O CRONÔMETRO CONTAR SEGUNDO POR SEGUNDO
  useEffect(() => {
    let intervalo = null

    if (timerAtivo && segundosRestantes > 0) {
      intervalo = setInterval(() => {
        setSegundosRestantes((prev) => prev - 1)
      }, 1000)
    } else if (timerAtivo && segundosRestantes === 0) {
      // O tempo acabou!
      clearInterval(intervalo)
      setTimerAtivo(false)
      
      if (modoAtual === 'Foco') {
        // Se acabou o tempo de foco, grava automaticamente no banco!
        salvarSessaoAutomatica()
        
        if (pausaInput && parseInt(pausaInput) > 0) {
          // Se tiver tempo de pausa configurado, ativa o modo descanso
          alert('🔔 Hora de pausar! Vá esticar as pernas e dar atenção para a namorada! ❤️')
          setModoAtual('Pausa')
          setSegundosRestantes(parseInt(pausaInput) * 60)
          setTimerAtivo(true)
        } else {
          alert('🏁 Sessão de estudos concluída com sucesso!')
          setModoAtual('Foco')
        }
      } else {
        // Se acabou o tempo de pausa
        alert('💪 O descanso acabou! Hora de voltar ao foco!')
        setModoAtual('Foco')
      }
    }

    return () => clearInterval(intervalo)
  }, [timerAtivo, segundosRestantes, modoAtual])

  // 🚀 INICIAR O CRONÔMETRO COM AS REGRAS QUE VOCÊ PEDIU
  const iniciarTimer = () => {
    if (!materia) {
      setMensagemEstudo('❌ Digite a matéria antes de começar!')
      return
    }
    if (!tempoInput || parseInt(tempoInput) <= 0) {
      setMensagemEstudo('❌ Digite um tempo válido em minutos!')
      return
    }

    const minutosFoco = parseInt(tempoInput)
    const minutosPausa = pausaInput ? parseInt(pausaInput) : 0

    // 🚨 LIMITADOR INTELIGENTE QUE VOCÊ PEDIU:
    // Se for 3 horas ou mais (180 min) e não colocou pausa, solta o alerta na tela
    if (minutosFoco >= 180 && minutosPausa === 0) {
      alert('⚠️ Dica de Rendimento Sertech: Estudar mais de 3 horas seguidas sem pausa pode reduzir sua retenção. Que tal programar pelo menos 15 ou 20 minutinhos de descanso para melhorar seus resultados?')
    }

    // Configura os segundos iniciais (minutos * 60)
    setModoAtual('Foco')
    setSegundosRestantes(minutosFoco * 60)
    setTimerAtivo(true)
    setMensagemEstudo('⏱️ Cronômetro valendo! Bons estudos!')
  }

  // 💾 ENVIA OS DADOS DIRETO PRO BANCO QUANDO O CRONÔMETRO ZERA
  const salvarSessaoAutomatica = async () => {
    try {
      const resposta = await fetch(`http://localhost:8000/auth/usuario/${usuarioId}/estudo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materia: materia,
          tempo_minutos: parseInt(tempoInput)
        })
      })

      if (resposta.ok) {
        setMensagemEstudo(`✅ Estudo de ${materia} gravado automaticamente no histórico!`)
        buscarEstudos()
      }
    } catch (error) {
      console.error('Erro ao salvar sessão automaticamente:', error)
    }
  }

  // Função para formatar segundos em MM:SS (Ex: 3600 segundos -> 60:00)
  const formatarTempo = (totalSegundos) => {
    const minutos = Math.floor(totalSegundos / 60)
    const segundos = totalSegundos % 60
    return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`
  }

  // Estilos reaproveitados
  const inputEstilo = { width: '100%', padding: '10px', marginTop: '6px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '14px' }
  const cardEstilo = { backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '20px' }

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        
        <h1 style={{ textAlign: 'center', color: '#1a1a1a', marginBottom: '30px', fontSize: '28px' }}>🚀 Meu Painel de Controle</h1>

        {/* CARD 1: PERFIL DO USUÁRIO (Ocultado as outras funções para focar no Cronômetro) */}
        
        {/* 🔥 CARD 2 TOTALMENTE NOVO: CRONÔMETRO POMODORO INTERATIVO */}
        <div style={cardEstilo}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#333', textAlign: 'center' }}>
            {timerAtivo ? `⏳ Modo atual: ${modoAtual}` : '⏱️ Configurar Sessão de Estudo'}
          </h3>

          {/* Se o timer NÃO estiver rodando, mostra os inputs para configurar */}
          {!timerAtivo && segundosRestantes === 0 ? (
            <>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '13px', color: '#666' }}>O que você vai estudar agora?</label>
                <input type="text" placeholder="Ex: React, Python, SQL" value={materia} onChange={(e) => setMateria(e.target.value)} style={inputEstilo} />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', color: '#666' }}>Tempo de Foco (minutos):</label>
                  <input type="number" placeholder="Ex: 60" value={tempoInput} onChange={(e) => setTempoInput(e.target.value)} style={inputEstilo} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', color: '#666' }}>Pausa/Descanso (minutos):</label>
                  <input type="number" placeholder="Ex: 20 (ou 0)" value={pausaInput} onChange={(e) => setPausaInput(e.target.value)} style={inputEstilo} />
                </div>
              </div>

              <button onClick={iniciarTimer} style={{ width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
                Iniciar Sessão de Estudo
              </button>
            </>
          ) : (
            /* Se o timer ESTIVER rodando, esconde os inputs e mostra o Relógio Gigante */
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📚 {materia}</h4>
              <div style={{ fontSize: '56px', fontWeight: 'bold', color: modoAtual === 'Foco' ? '#28a745' : '#dc3545', fontFamily: 'monospace', margin: '20px 0' }}>
                {formatarTempo(segundosRestantes)}
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button onClick={() => setTimerAtivo(!timerAtivo)} style={{ padding: '10px 20px', backgroundColor: timerAtivo ? '#ffc107' : '#28a745', color: timerAtivo ? '#000' : '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {timerAtivo ? '⏸️ Pausar Relógio' : '▶️ Retomar'}
                </button>
                <button onClick={() => { setTimerAtivo(false); setSegundosRestantes(0); setModoAtual('Foco'); }} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  ⏹️ Cancelar
                </button>
              </div>
            </div>
          )}

          {mensagemEstudo && <p style={{ marginTop: '15px', color: '#007bff', fontSize: '14px', fontWeight: 'bold', textAlign: 'center', margin: 0 }}>{mensagemEstudo}</p>}
        </div>

        {/* CARD 3: HISTÓRICO DE ESTUDOS */}
        <div style={cardEstilo}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>📊 Histórico de Estudos</h3>
          {listaEstudos.length === 0 ? (
            <p style={{ color: '#888', fontStyle: 'italic', textAlign: 'center' }}>Nenhum estudo registrado ainda.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {listaEstudos.map((estudo) => (
                <div key={estudo.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                  <div>
                    <span style={{ fontSize: '16px', marginRight: '8px' }}>📚</span>
                    <strong style={{ color: '#495057' }}>{estudo.materia}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ color: '#495057', fontSize: '14px', fontWeight: '500' }}>⏱️ {estudo.tempo_minutos} min</span>
                    <span style={{ color: '#adb5bd', fontSize: '12px' }}>📅 {estudo.data}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Dashboard