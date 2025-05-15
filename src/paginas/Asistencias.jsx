// src/pages/Asistencias.jsx
import React from 'react'

export default function Asistencias() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Registro de Asistencias</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tarjeta de explicación */}
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-gray-600">
            Marca la asistencia de los participantes en cada sesión.
          </p>
        </div>

        {/* Placeholder de tabla */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-xl shadow p-8 text-center text-gray-400">
          <p>Tabla de participantes con checkbox (pendiente)</p>
        </div>
      </div>
    </div>
  )
}
