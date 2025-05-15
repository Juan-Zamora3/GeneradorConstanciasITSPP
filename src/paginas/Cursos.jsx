// src/pages/Cursos.jsx
import React from 'react'

export default function Cursos() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Gestión de Cursos</h2>

      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-gray-600 mb-4">
          Crea, edita y busca tus cursos institucionales.
        </p>
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
          Nuevo Curso
        </button>
      </div>
    </div>
  )
}
