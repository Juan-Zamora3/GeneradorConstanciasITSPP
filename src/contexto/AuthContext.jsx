// src/contexto/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    // Al montar, leo de localStorage
    const stored = JSON.parse(localStorage.getItem('user'))
    if (stored) setUsuario(stored)
  }, [])

  const login = ({ name, email }) => {
    localStorage.setItem('user', JSON.stringify({ name, email }))
    setUsuario({ name, email })
  }

  const logout = () => {
    localStorage.removeItem('user')
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
