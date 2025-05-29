import React from 'react'

export default function ActionButtons({ onPreview, onZip, onSend }) {
  return (
    <div className="space-y-2">
      <button
        onClick={onPreview}
        className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        Previsualizar
      </button>
      <button
        onClick={onZip}
        className="w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
      >
        Descargar ZIP
      </button>
      <button
        onClick={() =>
          window.confirm('¿Enviar correos?') && onSend()
        }
        className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Enviar por correo
      </button>
    </div>
  )
}
