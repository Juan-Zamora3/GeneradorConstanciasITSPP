import React from 'react';

/**
 * Muestra una lista de asistencias registradas
 * @param {{list: Array, onView: Function}} props
 */
export default function AttendanceList({ list, onView }) {
  if (!list.length) {
    return <p className="text-gray-500">No hay asistencias registradas.</p>;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-md font-semibold text-gray-700">Asistencias Registradas</h4>
      <ul className="max-h-48 overflow-y-auto space-y-1">
        {list.map((a, idx) => {
          const date = a.timestamp?.toDate
            ? a.timestamp.toDate()
            : new Date(a.timestamp);
          return (
            <li
              key={idx}
              className="flex justify-between items-center bg-white p-2 rounded shadow"
            >
              <div>
                <p className="font-medium">{a.nombre}</p>
                <p className="text-xs text-gray-600">
                  {date.toLocaleString('es-MX')}
                </p>
              </div>
              <button
                onClick={() => onView(a)}
                className="text-blue-600 hover:underline text-sm"
              >
                Ver foto
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
