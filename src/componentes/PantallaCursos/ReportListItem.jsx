// src/componentes/PantallaCursos/ReportListItem.jsx
import React, { useState, useEffect } from 'react';

export default function ReportListItem({ report, onView, onDelete }) {
  /* índice que cambia cada 3 s */
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!report.imagenes || report.imagenes.length <= 1) return;

    const id = setInterval(
      () => setIdx(i => (i + 1) % report.imagenes.length),
      3000
    );
    return () => clearInterval(id);
  }, [report.imagenes]);

  const srcActual = report.imagenes?.[idx] || '/placeholder.png';

  return (
    <article className="relative bg-white border rounded-xl overflow-hidden hover:shadow-lg transition">
      {/* Badge */}
      <span className="absolute top-3 right-3 bg-gray-900/80 text-white text-[11px] px-2 py-0.5 rounded-full capitalize">
        {report.tipo}
      </span>

      {/* Imagen que rota */}
      <img
        src={srcActual}
        alt={report.titulo}
        className="w-full h-40 object-cover"
      />

      <div className="p-4">
        <h4 className="font-semibold truncate">{report.titulo}</h4>
        <p className="text-xs text-gray-500 mb-3">
          {new Date(report.fecha).toLocaleDateString('es-MX')}
        </p>

        <hr className="border-gray-200 mb-2" />

        <div className="flex justify-end gap-4">
          <button
            onClick={onView}
            className="text-blue-600 text-sm hover:underline"
          >
            Ver detalle
          </button>
          <button
            onClick={onDelete}
            className="text-red-500 text-sm hover:underline"
          >
            Eliminar
          </button>
        </div>
      </div>
    </article>
  );
}
