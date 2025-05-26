import React from 'react';

export default function DetailsModal({ isOpen, onClose, data, type }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4 overflow-y-auto max-h-full">
        <h3 className="text-xl font-semibold">
          {type === 'course' ? 'Detalles del Curso' : 'Detalles del Reporte'}
        </h3>
        {type === 'course' ? (
          <div className="grid grid-cols-1 gap-4">
            {['Título','Instructor','Fechas','Ubicación','Categoría','Estado'].map((lbl,i)=>(
              <p key={i}><strong>{lbl}:</strong> {data[Object.keys(data)[i]]}</p>
            ))}
            <p><strong>Participantes:</strong> {data.participantes.length}</p>
            <p><strong>Reportes:</strong> {data.reportes.length}</p>
            <p><strong>Descripción:</strong> {data.descripcion}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
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
  );
}
