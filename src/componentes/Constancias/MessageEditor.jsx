import React from "react";

export default function MessageEditor({
  mensajePDF,
  setMensajePDF,
  mensajeCorreo,
  setMensajeCorreo,
}) {
  return (
    <section className="space-y-4">
      <div>
        <h4 className="font-semibold mb-1">Mensaje PDF</h4>
        <textarea
          rows={3}
          className="w-full p-2 border rounded"
          value={mensajePDF}
          onChange={(e) => setMensajePDF(e.target.value)}
        />
        <p className="text-[11px] text-gray-500 mt-1">
          Placeholders: <code>{'{nombre}'}</code>, <code>{'{curso}'}</code>,{" "}
          <code>{'{puesto}'}</code>, <code>{'{fechainicio}'}</code>,{" "}
          <code>{'{fechafin}'}</code>
        </p>
      </div>

      <div>
        <h4 className="font-semibold mb-1">Mensaje Correo</h4>
        <textarea
          rows={3}
          className="w-full p-2 border rounded"
          value={mensajeCorreo}
          onChange={(e) => setMensajeCorreo(e.target.value)}
        />
      </div>
    </section>
  );
}
