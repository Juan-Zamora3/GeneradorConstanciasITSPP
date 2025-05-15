import React, { useEffect, useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexto/AuthContext'

export default function Inicio() {
  const navigate = useNavigate()
  const { usuario, logout } = useContext(AuthContext)
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (!usuario) {
      navigate('/login', { replace: true })
    } else {
      setUser(usuario)
    }
  }, [usuario, navigate])

  if (!user) return null

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl shadow p-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">¡Bienvenido, {user.name}!</h2>
          <p className="text-gray-600">({user.email})</p>
        </div>
        <button
          onClick={() => logout() || navigate('/login', { replace: true })}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          Cerrar sesión
        </button>
      </div>
      {/* ... */}
    </div>
  )
}
