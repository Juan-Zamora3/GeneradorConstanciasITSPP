import React from 'react';
import ReportListItem from './PantallaCursos/ReportListItem';

export default function ReportList({ reports }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {reports.map(r => (
        <ReportListItem key={r.id} report={r} />
      ))}
    </div>
  );
}
