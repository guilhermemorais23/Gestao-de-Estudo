import React, { useState, useEffect } from 'react'

function Dashboard() {
  const idArmazenado = localStorage.getItem("usuarioId")
  const usuarioId = (idArmazenado && idArmazenado !== "undefined") ? idArmazenado : 2

  // Estados do CRUD de Usuário
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('user@example.com')
  const [mensagem, setMensagem] = useState('')

  const [categoriaSelecionada, setCategoriaSelecionada] = useState('')
  const [listaCategorias, setListaCategorias] = useState([])
  const [listaEstudos, setListaEstudos] = useState([])
  const [novaCategoriaInput, setNovaCategoriaInput] = useState('')

  // ESTADOS NOVOS DO CRONÔMETRO INTERATIVO
  const [tempoInput, setTempoInput] = useState('') // Tempo que o usuário digita (em minutos)
  const [pausaInput, setPausaInput] = useState('') // Tempo de descanso (em minutos)
  const [segundosRestantes, setSegundosRestantes] = useState(0)
  const [timerAtivo, setTimerAtivo] = useState(false)
  const [modoAtual, setModoAtual] = useState('Foco') // 'Foco' ou 'Pausa'
  const [mensagemEstudo, setMensagemEstudo] = useState('')

  // 🔍 1. BUSCAR HISTÓRICO DE ESTUDOS DO BANCO
  const buscarEstudos = async () => {
    try {
      const resposta = await fetch(`http://localhost:8000/auth/usuario/${usuarioId}/estudos`)
      const dados = await resposta.json()
      if (resposta.ok) setListaEstudos(dados)
    } catch (error) {
      console.error('Erro ao buscar estudos:', error)
    }
  }

  // 📥 2. BUSCAR AS CATEGORIAS FIXAS DO BANCO
  const carregarCategorias = async () => {
    try {
      const resposta = await fetch(`http://localhost:8000/auth/usuario/${usuarioId}/categorias`)
      if (resposta.ok) {
        const dados = await resposta.json()
        setListaCategorias(dados)
        // Se o usuário tiver categorias cadastradas, já deixa a primeira selecionada
        if (dados.length > 0) {
          setCategoriaSelecionada(dados[0].id)
        }
      }
    } catch (error) {
      console.error("Erro ao buscar categorias:", error)
    }
  }

  // ➕ 3. CADASTRAR UMA NOVA CATEGORIA VIA BOTÃO
  const adicionarNovaCategoria = async () => {
    if (!novaCategoriaInput.trim()) return alert("Digite o nome de uma categoria!")
    try {
      const resposta = await fetch(`http://localhost:8000/auth/usuario/${usuarioId}/categorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome_categoria: novaCategoriaInput })
      })
      if (resposta.ok) {
        setNovaCategoriaInput('')
        carregarCategorias() // Recarrega a lista para atualizar o menu select
        alert("🏷️ Categoria criada com sucesso!")
      } else {
        const erro = await resposta.json()
        alert(`❌ ${erro.detail}`)
      }
    } catch (error) {
      console.error("Erro ao criar categoria:", error)
    }
  }

  // 🔄 4. GATILHO QUE RODA ASSIM QUE A TELA ABRE
  useEffect(() => {
    buscarEstudos()
    carregarCategorias()
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
        // Se acabou o tempo de foco, grava automaticamente no banco passando os minutos digitados!
        salvarSessaoAutomatica(parseInt(tempoInput))
        
        if (pausaInput && parseInt(pausaInput) > 0) {
          alert('🔔 Hora de pausar!')
          setModoAtual('Pausa')
          setSegundosRestantes(parseInt(pausaInput) * 60)
          setTimerAtivo(true)
        } else {
          alert('🏁 Sessão de estudos concluída com sucesso!')
          setModoAtual('Foco')
        }
      } else {
        alert('💪 O descanso acabou! Hora de voltar ao foco!')
        setModoAtual('Foco')
      }
    }

    return () => clearInterval(intervalo)
  }, [timerAtivo, segundosRestantes, modoAtual])

  // 🚀 INICIAR O CRONÔMETRO
  const iniciarTimer = () => {
    if (!categoriaSelecionada) {
      setMensagemEstudo('❌ Selecione ou crie uma categoria antes de começar!')
      return
    }
    if (!tempoInput || parseInt(tempoInput) <= 0) {
      setMensagemEstudo('❌ Digite um tempo válido em minutos!')
      return
    }

    const minutosFoco = parseInt(tempoInput)
    const minutosPausa = pausaInput ? parseInt(pausaInput) : 0

    if (minutosFoco >= 180 && minutosPausa === 0) {
      alert('⚠️ Dica de Rendimento Sertech: Estudar mais de 3 horas seguidas sem pausa pode reduzir sua retenção. Que tal programar pelo menos 15 ou 20 minutinhos de descanso para melhorar seus resultados?')
    }

    setModoAtual('Foco')
    setSegundosRestantes(minutosFoco * 60)
    setTimerAtivo(true)
    setMensagemEstudo('⏱️ Cronômetro valendo! Bons estudos!')
  }

  // ENVIA OS DADOS DIRETO PRO BANCO QUANDO O CRONÔMETRO ZERA
  const salvarSessaoAutomatica = async (minutosEstudados) => {

    console.log("DEBUG COMPLETO DOS DADOS:", {
      usuarioId_usado: usuarioId,
      categoriaSelecionada_estado: categoriaSelecionada,
      listaCategorias_atual: listaCategorias,
      minutosEstudados_parametro: minutosEstudados,
      tempoInput_estado: tempoInput
    });
    
    let idParaSalvar = categoriaSelecionada;
    
    if (!idParaSalvar && listaCategorias.length > 0) {
      idParaSalvar = listaCategorias[0].id;
    }

    if (!idParaSalvar || isNaN(parseInt(idParaSalvar))) {
      alert("Por favor, selecione ou crie uma categoria para salvar seu estudo!");
      return;
    }

    const minutos = parseInt(minutosEstudados) || parseInt(tempoInput) || 1;

    try {
      const resposta = await fetch(`http://localhost:8000/auth/usuario/${usuarioId}/estudo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoria_id: parseInt(idParaSalvar),
          tempo_minutos: minutos
        })
      });

      if (resposta.ok) {
        await resposta.json();
        setMensagemEstudo(`✅ Estudo gravado automaticamente no histórico!`);
        buscarEstudos(); // Atualiza a lista na tela na hora!
      } else {
        console.error('Erro na resposta do servidor:', resposta.status);
      }
    } catch (error) {
      console.error('Erro ao salvar sessão automaticamente:', error);
    }
  };

  const limparHistorico = async () => {
    const confirmar = window.confirm("Tem certeza que deseja apagar todo o historico de estudo?")
    if (!confirmar) return

    try {
      const resposta = await fetch(`http://localhost:8000/auth/usuario/${usuarioId}/estudos`, {
        method: 'DELETE'
      })

      if (resposta.ok) {
        alert("Historico apagado com sucesso")
        setListaEstudos([])
      } else {
        alert("Não foi possível apagar o histórico.")
      }
    } catch (error) {
      console.error("Erro ao apagar historico", error)
      alert('Erro de conexao com o servidor')
    }
  }

  const formatarTempo = (totalSegundos) => {
    const minutos = Math.floor(totalSegundos / 60)
    const segundos = totalSegundos % 60
    return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`
  }

  const inputEstilo = { width: '100%', padding: '10px', marginTop: '6px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '14px' }
  const cardEstilo = { backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '20px' }

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        
        <h1 style={{ textAlign: 'center', color: '#1a1a1a', marginBottom: '30px', fontSize: '28px' }}>🚀 Meu Painel de Controle</h1>

        {/* CARD 2: CRONÔMETRO POMODORO INTERATIVO */}
        <div style={cardEstilo}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#333', textAlign: 'center' }}>
            {timerAtivo ? `⏳ Modo atual: ${modoAtual}` : '⏱️ Configurar Sessão de Estudo'}
          </h3>

          {!timerAtivo && segundosRestantes === 0 ? (
            <>
              {/* CONTAINER DE CATEGORIAS */}
              <div style={{ marginBottom: '20px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  <input 
                    type="text" 
                    placeholder="Ex: Python, React, Lógica..." 
                    value={novaCategoriaInput}
                    onChange={(e) => setNovaCategoriaInput(e.target.value)}
                    style={inputEstilo}
                  />
                  <button 
                    onClick={adicionarNovaCategoria}
                    style={{ backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}
                  >
                    ➕ Criar Categoria
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057', textAlign: 'left' }}>O que você vai estudar agora?</label>
                  <select 
                    value={categoriaSelecionada} 
                    onChange={(e) => setCategoriaSelecionada(e.target.value)}
                    style={inputEstilo}
                  >
                    {listaCategorias.length === 0 ? (
                      <option value="">⚠️ Cadastre uma categoria acima primeiro!</option>
                    ) : (
                      listaCategorias.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nome_categoria}
                        </option>
                      ))
                    )}
                  </select>
                </div>
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
              <button onClick={() => salvarSessaoAutomatica(5)} style={{ padding: '10px', backgroundColor: '#purple', color: 'white' }}>
  ⚡ Testar Envio Direto
</button>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              {/* 🌟 CORRIGIDO: de nome_categorira para nome_categoria */}
              <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>
                📚 {listaCategorias.find(cat => cat.id === parseInt(categoriaSelecionada))?.nome_categoria || "Selecione uma categoria"}
              </h4>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>📊 Histórico de Estudos</h3>
            {listaEstudos.length > 0 && (
              <button 
                onClick={limparHistorico} 
                style={{ backgroundColor: 'transparent', color: '#dc3545', border: '1px solid #dc3545', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: '0.2s' }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#fff5f5'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                🗑️ Limpar Histórico
              </button>
            )}
          </div>
          {listaEstudos.length === 0 ? (
            <p style={{ color: '#88', fontStyle: 'italic', textAlign: 'center' }}>Nenhum estudo registrado ainda.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {listaEstudos.map((estudo) => (
                <div key={estudo.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                  <div>
                    {/* 🌟 CORRIGIDO: de estudo.cateria para estudo.categoria */}
                    <span style={{ fontSize: '16px', marginRight: '8px', fontWeight: 'bold', color: '#007bff' }}>
                      📚 {estudo.categoria?.nome_categoria || "Geral"}
                    </span>
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