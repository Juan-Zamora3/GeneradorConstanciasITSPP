import React from 'react';

export default function ReportListItem({ report }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-2">
      <h4 className="font-medium">{report.titulo}</h4>
      <p className="text-sm text-gray-600">{report.tipo}</p>
      <p className="text-xs text-gray-500">
        {new Date(report.fecha).toLocaleDateString('es-MX')}
      </p>
    </div>
  );
}
