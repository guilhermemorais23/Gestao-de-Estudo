import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Login() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true) // Controla se mostra Login ou Registro
  
  // Estados dos formulários
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [mensagem, setMensagem] = useState('')

  // 💥 SUA FUNÇÃO ATUALIZADA E INTEGRADA:
  const handleAcao = async () => {
    if (!email || !senha) {
      setMensagem('❌ Preencha todos os campos!');
      return;
    }

    const url = isLogin 
      ? 'http://localhost:8000/auth/login' 
      : 'http://localhost:8000/auth/registrar';

    try {
      const resposta = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          senha: senha,
          ...(isLogin ? {} : { name: nome })
        })
      });

      const dados = await resposta.json();

      console.log("REQUISICAO COMPLETA DO PYTHON:", dados);
      console.log("TESTE DE ACESSO AO ID:", dados?.user?.id || dados?.id);

      if (resposta.ok) {
        setMensagem(isLogin ? '✨ Login efetuado com sucesso!' : '✅ Conta criada com sucesso! Faça o login.');
        
        if (isLogin) {
          localStorage.setItem('usuarioId', dados.user.id);
          
          setTimeout(() => {
            navigate('/dashboard');
          }, 1200);
        } else {
          setIsLogin(true);
          setEmail('');
          setSenha('');
        }
      } else {
        setMensagem(`❌ Erro: ${dados.detail || 'Falha na requisição'}`);
      }
    } catch (error) {
      setMensagem('❌ Erro ao conectar com o servidor de autenticação.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '350px', textAlign: 'center' }}>
        
        <h2 style={{ marginBottom: '24px', color: '#333' }}>
          {isLogin ? '🔑 Entrar no Sistema' : '📝 Criar Conta'}
        </h2>

        {!isLogin && (
          <div style={{ marginBottom: '15px', textAlign: 'left' }}>
            <label style={{ fontSize: '14px', color: '#666' }}>Nome:</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
          </div>
        )}

        <div style={{ marginBottom: '15px', textAlign: 'left' }}>
          <label style={{ fontSize: '14px', color: '#666' }}>E-mail:</label>
          <input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: '20px', textAlign: 'left' }}>
          <label style={{ fontSize: '14px', color: '#666' }}>Senha:</label>
          <input type="password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>

        <button onClick={handleAcao} style={{ width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
          {isLogin ? 'Acessar Painel' : 'Cadastrar'}
        </button>

        <p style={{ marginTop: '20px', fontSize: '14px', color: '#555' }}>
          {isLogin ? 'Novo por aqui? ' : 'Já tem conta? '}
          <span onClick={() => { setIsLogin(!isLogin); setMensagem(''); }} style={{ color: '#007bff', cursor: 'pointer', fontWeight: 'bold' }}>
            {isLogin ? 'Crie uma conta' : 'Faça login'}
          </span>
        </p>

        {mensagem && <p style={{ marginTop: '15px', color: isLogin ? 'green' : 'blue', fontWeight: 'bold' }}>{mensagem}</p>}
      </div>
    </div>
  )
}

export default Login