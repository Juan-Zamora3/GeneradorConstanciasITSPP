// src/pages/Constancias.jsx
import React from 'react'

export default function Constancias() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Generar Constancias</h2>

      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-gray-600 mb-4">
          Genera y envía automáticamente constancias en PDF cuando un curso finalice.
        </p>
        <button className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 transition">
          Generar Constancias
        </button>
      </div>
    </div>
  )
}
