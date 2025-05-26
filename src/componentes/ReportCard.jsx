import React from 'react';

export default function ReportCard({ report }) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-4 space-y-1">
      <div className="flex justify-between items-center">
        <h4 className="font-medium line-clamp-1">{report.titulo}</h4>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{report.tipo}</span>
      </div>
      <p className="text-xs text-gray-500">
        {new Date(report.fecha).toLocaleDateString('es-MX')}
      </p>
      <button className="text-blue-600 text-sm hover:underline">Ver detalle</button>
    </div>
  );
}
