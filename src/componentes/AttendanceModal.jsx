// src/componentes/AttendanceModal.jsx
import React from 'react';

export default function AttendanceModal({ asistencia, onClose }) {
  if (!asistencia) return null;

  // Si tu timestamp viene de Firestore Timestamp
  const fecha = asistencia.timestamp?.toDate
    ? asistencia.timestamp.toDate()
    : new Date(asistencia.timestamp);

  return (
    // overlay con backdrop-blur y fondo semitransparente blanco
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-white/30">
      {/* modal más ancho: hasta 36rem (xl) */}
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6 space-y-6">
        <h2 className="text-2xl font-semibold">Detalle de Asistencia</h2>

        <div className="space-y-2 text-gray-700">
          <p>
            <span className="font-medium">Nombre:</span> {asistencia.nombre}
          </p>
          <p>
            <span className="font-medium">Puesto:</span> {asistencia.puesto}
          </p>
          <p>
            <span className="font-medium">Fecha:</span>{' '}
            {fecha.toLocaleDateString('es-MX')} a las {fecha.toLocaleTimeString('es-MX')}
          </p>
        </div>

        {/* contenedor responsivo para la imagen */}
        <div className="w-full aspect-[4/3] relative">
          <img
            src={asistencia.fotoURL}
            alt="Asistencia"
            className="absolute inset-0 w-full h-full object-cover rounded-lg"
          />
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
