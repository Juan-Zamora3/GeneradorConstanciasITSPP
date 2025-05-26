import React from 'react';

export default function ToggleViewButton({ view, setView }) {
  return (
    <div className="flex gap-3 mb-6">
      {['courses', 'reports'].map(v => (
        <button
          key={v}
          onClick={() => setView(v)}
          className={
            `px-5 py-2 rounded-full font-medium transition ` +
            (view === v
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
          }
        >
          {v === 'courses' ? 'Cursos' : 'Reportes'}
        </button>
      ))}
    </div>
  );
}
