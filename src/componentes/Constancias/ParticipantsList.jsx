import React from "react";

function TableShell({ head, children }) {
  return (
    <div className="border rounded max-h-48 overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-gray-200">
          <tr>
            {head.map((h, i) => (
              <th key={i} className={h.className || "p-2"}>
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export default function ParticipantsList({
  mode, // 'individual'|'equipos'
  // individuales
  participantes,
  checkedInit,
  toggleInit,
  asistencias,
  onShowAttendance,
  // equipos
  equipos,               // [{id, equipo, lider, contacto, correos:[], integrantes:[]}]
  checkedTeams,          // {id:boolean}
  toggleTeam,
}) {
  if (mode === "equipos") {
    return (
      <section className="space-y-2">
        <h4 className="font-semibold">Equipos registrados</h4>
        <TableShell
          head={[
            { label: "Sel", className: "w-10 p-2" },
            { label: "Equipo" },
            { label: "Líder" },
            { label: "Contacto" },
            { label: "Emails" },
            { label: "Integrantes" },
          ]}
        >
          {equipos.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-3 text-center text-gray-500">
                No hay equipos
              </td>
            </tr>
          ) : (
            equipos.map((t) => (
              <tr key={t.id} className="odd:bg-gray-100 hover:bg-gray-200">
                <td className="text-center p-2">
                  <input
                    type="checkbox"
                    checked={!!checkedTeams[t.id]}
                    onChange={() => toggleTeam(t.id)}
                  />
                </td>
                <td className="p-2 break-words">{t.equipo || "—"}</td>
                <td className="p-2 break-words">{t.lider || "—"}</td>
                <td className="p-2 break-words">{t.contacto || "—"}</td>
                <td className="p-2 break-words">
                  {t.correos?.length ? t.correos.join(", ") : "—"}
                </td>
                <td className="p-2 break-words">
                  {t.integrantes?.length ? t.integrantes.join(", ") : "—"}
                </td>
              </tr>
            ))
          )}
        </TableShell>
        <p className="text-[11px] text-gray-500">
          * Los equipos se leen de <code>encuestas_respuestas</code> por{" "}
          <code>encuestaId</code>.
        </p>
      </section>
    );
  }

  // modo individual
  return (
    <>
      <section className="space-y-2">
        <h4 className="font-semibold">Participantes Iniciales</h4>
        <TableShell
          head={[
            { label: "Sel", className: "w-10 p-2" },
            { label: "Nombre" },
            { label: "Puesto" },
          ]}
        >
          {participantes.length === 0 ? (
            <tr>
              <td colSpan={3} className="p-3 text-center text-gray-500">
                No hay personal
              </td>
            </tr>
          ) : (
            participantes.map((p, i) => (
              <tr key={p.id || i} className="odd:bg-gray-100 hover:bg-gray-200">
                <td className="text-center p-2">
                  <input
                    type="checkbox"
                    checked={!!checkedInit[i]}
                    onChange={() => toggleInit(i)}
                  />
                </td>
                <td className="p-2 break-words">
                  {(p.Nombres ? `${p.Nombres} ${p.ApellidoP || ""}` : p.nombre) ||
                    "—"}
                </td>
                <td className="p-2 break-words">{p.Puesto || p.puesto || "—"}</td>
              </tr>
            ))
          )}
        </TableShell>
      </section>

      <section className="space-y-2">
        <h4 className="font-semibold">Asistencias Registradas</h4>
        <TableShell
          head={[
            { label: "Sel", className: "w-10 p-2" },
            { label: "Nombre" },
            { label: "Puesto" },
            { label: "Acción" },
          ]}
        >
          {asistencias.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-3 text-center text-gray-500">
                No hay asistencias
              </td>
            </tr>
          ) : (
            asistencias.map((a, i) => (
              <tr key={a.id || i} className="odd:bg-gray-100 hover:bg-gray-200">
                <td className="text-center p-2">
                  <input type="checkbox" checked disabled />
                </td>
                <td className="p-2 break-words">
                  {(a.Nombres ? `${a.Nombres} ${a.ApellidoP || ""}` : a.nombre) ||
                    "—"}
                </td>
                <td className="p-2 break-words">{a.Puesto || a.puesto || "—"}</td>
                <td className="text-center p-2">
                  <button
                    type="button"
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                    onClick={() => onShowAttendance?.(a)}
                  >
                    Detalles
                  </button>
                </td>
              </tr>
            ))
          )}
        </TableShell>
      </section>
    </>
  );
}
