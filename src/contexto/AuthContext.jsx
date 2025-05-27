import React, { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)

  // Al montar, leo de localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user'))
    if (stored) setUsuario(stored)
  }, [])

  // Ahora login recibe también role
  const login = ({ name, email, role }) => {
    const u = { name, email, role }
    localStorage.setItem('user', JSON.stringify(u))
    setUsuario(u)
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
