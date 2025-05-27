// src/componentes/PantallaCrearUsuario/UsuarioCard.jsx
import React from 'react'

export default function UsuarioCard({ usuario, onDelete }) {
  // fallback a cadena vacía si no hay nombre
  const fullName = usuario.nombre || ''
  const initials = fullName
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()

  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold mb-4">
        {initials || '?'}
      </div>
      <h4 className="font-semibold text-gray-800">
        {fullName || 'Sin nombre'}
      </h4>
      <p className="text-sm text-gray-500">{usuario.correo}</p>
      <span className="mt-2 inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">
        {usuario.role}
      </span>
      <button
        onClick={() => onDelete(usuario.id)}
        className="mt-4 text-red-500 hover:underline text-sm"
      >
        Eliminar
      </button>
    </div>
  )
}
