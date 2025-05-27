import React from 'react'

export default function DetailsModal({ isOpen, onClose, data, type }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4 overflow-y-auto max-h-full">
        <h3 className="text-xl font-semibold">
          {type === 'course' ? 'Detalles del Curso' : 'Detalles del Reporte'}
        </h3>
        {type === 'course' ? (
          <div className="grid grid-cols-1 gap-4 text-sm">
            <p><strong>Título:</strong> {data.titulo}</p>
            <p><strong>Instructor:</strong> {data.instructor}</p>
            <p><strong>Fechas:</strong> {data.fechaInicio} – {data.fechaFin}</p>
            <p><strong>Ubicación:</strong> {data.ubicacion}</p>
            <p><strong>Categoría:</strong> {data.categoria}</p>
            <p><strong>Estado:</strong> {data.estado}</p>
            <p><strong>Participantes:</strong> {data.lista?.length || 0}</p>
            <p><strong>Reportes:</strong> {data.reportes?.length || 0}</p>
            <p><strong>Descripción:</strong> {data.descripcion}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 text-sm">
            <p><strong>Título:</strong> {data.titulo}</p>
            <p><strong>Tipo:</strong> {data.tipo}</p>
            <p><strong>Fecha:</strong> {new Date(data.fecha).toLocaleDateString('es-MX')}</p>
            <p><strong>Descripción:</strong> {data.descripcion}</p>
          </div>
        )}
        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
