// src/componentes/PantallaPersonal/ParticipantCardIdea2.jsx
import React, { useState, useRef, useEffect } from 'react';

const PALETTE = ['#0A93E0', '#0882CD', '#0572BB', '#0361A8', '#005095'];

export default function ParticipantCardIdea2({ participant, onView, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = (n, a) =>
    n.charAt(0).toUpperCase() + (a ? a.charAt(0).toUpperCase() : '');

  const sum = [...participant.id].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const idx = sum % PALETTE.length;
  const c1 = PALETTE[idx], c2 = PALETTE[(idx + 1) % PALETTE.length];
  const gradientStyle = { background: `linear-gradient(135deg, ${c1}, ${c2})` };

  return (
    <div className="relative bg-white rounded-xl shadow-lg overflow-visible flex items-stretch h-full w-full">
      {/* Left: degradado + avatar */}
      <div className="w-1/3 flex items-center justify-center" style={gradientStyle}>
        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-xl font-semibold text-gray-700 shadow-md">
          {initials(participant.nombre, participant.apellidos)}
        </div>
      </div>

      {/* Right: contenido */}
      <div className="w-2/3 p-4 flex flex-col justify-center">
        <h4 className="text-lg font-semibold text-gray-800 leading-snug">
          {participant.nombre} {participant.apellidos}
        </h4>
        <p className="text-sm text-gray-500 mt-1">{participant.area}</p>
        <p className="text-sm text-gray-500 mt-2 truncate">{participant.correo}</p>
      </div>

      {/* Trigger vertical */}
      <div ref={ref} className="absolute top-2 right-2">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-6 h-12 flex flex-col items-center justify-around bg-white rounded-full shadow hover:bg-gray-100 transition"
          aria-label="Opciones"
        >
          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-28 bg-white rounded-lg shadow-lg z-50">
            <button
              onClick={() => { setOpen(false); onView(participant); }}
              className="block w-full py-2 text-sm text-center text-white bg-blue-500 hover:bg-blue-600 transition"
            >
              Ver
            </button>
            <button
              onClick={() => { setOpen(false); onEdit(participant); }}
              className="block w-full py-2 text-sm text-center text-white bg-green-500 hover:bg-green-600 transition"
            >
              Editar
            </button>
            <button
              onClick={() => { setOpen(false); onDelete(participant); }}
              className="block w-full py-2 text-sm text-center text-white bg-red-500 hover:bg-red-600 transition"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
