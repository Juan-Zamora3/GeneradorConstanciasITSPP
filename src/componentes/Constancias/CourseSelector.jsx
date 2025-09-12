import React from "react";

export default function CourseSelector({
  courses,
  cursoId,
  setCursoId,
  mode,            // 'individual' | 'equipos'
  setMode,
  hasEncuesta,     // boolean (curso.encuestaId)
}) {
  return (
    <section className="space-y-3">
      <h4 className="font-semibold">Seleccionar Evento</h4>

      <select
        className="w-full p-2 border rounded"
        value={cursoId}
        onChange={(e) => setCursoId(e.target.value)}
      >
        <option value="">-- Elige --</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.titulo || c.cursoNombre || "Sin título"}
          </option>
        ))}
      </select>

      <div className="pt-2">
        <h5 className="font-semibold mb-2">Modo de generación</h5>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={mode === "individual"}
            onChange={() => setMode("individual")}
          />
          <span>Individuales (Personal / Asistencias)</span>
        </label>

        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={mode === "equipos"}
            onChange={() => setMode("equipos")}
          />
          <span>Por equipos (Registro de grupos)</span>
        </label>

        {mode === "equipos" && !hasEncuesta && (
          <p className="mt-2 text-xs text-amber-600">
            Este curso no tiene <code>encuestaId</code>. Genera el link/encuesta
            para habilitar equipos.
          </p>
        )}
      </div>
    </section>
  );
}
