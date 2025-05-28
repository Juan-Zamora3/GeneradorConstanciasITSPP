import React from 'react';

/**
 * Modal para mostrar detalle de una asistencia
 * @param {{asistencia: Object, onClose: Function}} props
 */
export default function AttendanceModal({ asistencia, onClose }) {
  if (!asistencia) return null;

  const date = asistencia.timestamp?.toDate
    ? asistencia.timestamp.toDate()
    : new Date(asistencia.timestamp);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded max-w-sm w-full space-y-4">
        <h3 className="text-lg font-semibold">Detalle de Asistencia</h3>
        <p><strong>Nombre:</strong> {asistencia.nombre}</p>
        <p><strong>Puesto:</strong> {asistencia.puesto}</p>
        <p><strong>Fecha:</strong> {date.toLocaleString('es-MX')}</p>
        <img
          src={asistencia.fotoURL}
          alt="Foto de asistencia"
          className="w-full rounded shadow"
        />
        <button
          onClick={onClose}
          className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
