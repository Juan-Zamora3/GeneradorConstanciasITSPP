import React from 'react'

export default function MessageEditor({
  mensajePDF,
  setMensajePDF,
  mensajeCorreo,
  setMensajeCorreo
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium">Mensaje en PDF</h3>
        <textarea
          rows={3}
          className="w-full border rounded p-2 resize-none"
          value={mensajePDF}
          onChange={e => setMensajePDF(e.target.value)}
        />
      </div>
      <div>
        <h3 className="font-medium">Mensaje en Correo</h3>
        <textarea
          rows={3}
          className="w-full border rounded p-2 resize-none"
          value={mensajeCorreo}
          onChange={e => setMensajeCorreo(e.target.value)}
        />
      </div>
    </div>
  )
}
