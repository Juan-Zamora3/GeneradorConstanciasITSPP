import React from 'react';
import ImageCarousel from '../common/ImageCarousel';

export default function DetailsModal({
  isOpen,
  onClose,
  data = {},
  type = 'course',
  onDelete,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4 overflow-y-auto max-h-full">
        <h3 className="text-xl font-semibold">
          {type === 'course' ? 'Detalles del Curso' : 'Detalles del Reporte'}
        </h3>

        {type === 'course' ? (
          <div className="grid grid-cols-1 gap-2 text-sm">
            <p><strong>Título:</strong> {data.titulo}</p>
            <p><strong>Instructor:</strong> {data.instructor}</p>
            <p><strong>Fechas:</strong> {data.fechaInicio} – {data.fechaFin}</p>
            <p><strong>Ubicación:</strong> {data.ubicacion}</p>
            <p><strong>Categoría:</strong> {data.categoria}</p>
            <p><strong>Estado:</strong> {data.estado}</p>
            <p><strong>Participantes:</strong> {data.lista?.length ?? 0}</p>
            <p><strong>Reportes:</strong> {data.reportes?.length ?? 0}</p>
            <p><strong>Descripción:</strong> {data.descripcion}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <p><strong>Título:</strong> {data.titulo}</p>
              <p><strong>Tipo:</strong> {data.tipo}</p>
              <p><strong>Fecha:</strong> {new Date(data.fecha).toLocaleDateString('es-MX')}</p>
              <p><strong>Descripción:</strong> {data.descripcion}</p>
            </div>

            {data.imagenes?.length > 0 && (
              <div className="pt-3">
                <ImageCarousel images={data.imagenes} />
              </div>
            )}
          </>
        )}

        <div className="flex justify-end gap-2 pt-4">
          {type === 'report' && onDelete && (
            <button onClick={onDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Eliminar
            </button>
          )}
          <button onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
