import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Puxando os arquivos direto da pasta pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Se entrar no link seco, joga pro login */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Rota da tela de Login nova e centralizada */}
        <Route path="/login" element={<Login />} />
        
        {/* Rota do seu Dashboard de Estudos que recuperamos */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App