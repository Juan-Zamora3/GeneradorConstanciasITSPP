import React from 'react'

export default function ParticipantsList({
  participantes,
  asistencias,
  checkedInit,
  checkedReal,
  showReal,
  onToggleReal,
  onChangeCheckInit,
  onChangeCheckReal
}) {
  const list = showReal ? asistencias : participantes
  const checks = showReal ? checkedReal : checkedInit

  return (
    <div>
      <button
        onClick={onToggleReal}
        className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        {showReal
          ? 'Ver Participantes Iniciales'
          : 'Ver Asistencias Registradas'}
      </button>

      <h4 className="mt-4 font-semibold">
        {showReal
          ? 'Asistencias Registradas'
          : 'Participantes (inicial)'}
      </h4>

      <div className="max-h-40 overflow-y-auto border rounded mt-1">
        <table className="w-full text-sm">
          <thead className="bg-purple-200 text-purple-800">
            <tr>
              <th className="p-1">Sel</th>
              <th className="p-1">Nombre</th>
              <th className="p-1">Puesto</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-2">
                  <input
                    type="checkbox"
                    checked={!!checks[i]}
                    onChange={() =>
                      showReal
                        ? onChangeCheckReal(i)
                        : onChangeCheckInit(i)
                    }
                  />
                </td>
                <td className="px-2">
                  {r.Nombres
                    ? `${r.Nombres} ${r.ApellidoP} ${r.ApellidoM}`
                    : r.nombre}
                </td>
                <td className="px-2">{r.Puesto}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
