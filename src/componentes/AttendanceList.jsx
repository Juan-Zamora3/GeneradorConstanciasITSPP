// src/componentes/AttendanceModal.jsx
import React from 'react';

export default function AttendanceModal({ asistencia, onClose }) {
  if (!asistencia) return null;
  const date = asistencia.timestamp?.toDate
    ? asistencia.timestamp.toDate()
    : new Date(asistencia.timestamp);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl mx-4">
        <h2 className="text-2xl font-semibold mb-4">Detalle de Asistencia</h2>
        <p><strong>Nombre:</strong> {asistencia.nombre}</p>
        <p><strong>Puesto:</strong> {asistencia.puesto}</p>
        <p className="mb-4">
          <strong>Fecha:</strong> {date.toLocaleDateString('es-MX')}, {date.toLocaleTimeString('es-MX')}
        </p>
        <div className="w-full h-64 overflow-hidden rounded-lg mb-6">
          <img
            src={asistencia.fotoURL}
            alt="Asistencia"
            className="object-cover w-full h-full"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
