import React from 'react'

export default function CourseSelector({ courses, selectedId, onChange }) {
  return (
    <div>
      <h3 className="text-lg font-semibold">Seleccionar Evento</h3>
      <select
        value={selectedId}
        onChange={e => onChange(e.target.value)}
        className="mt-2 w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
      >
        <option value="">-- Elige un curso --</option>
        {courses.map(c => (
          <option key={c.id} value={c.id}>
            {c.titulo}
          </option>
        ))}
      </select>
    </div>
  )
}
