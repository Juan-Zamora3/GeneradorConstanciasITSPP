import React from 'react';
import { FiLoader, FiRotateCcw } from 'react-icons/fi';

function Pill({ status }) {
  const map = {
    pendiente: 'bg-gray-200 text-gray-800',
    'sin correo': 'bg-amber-100 text-amber-800',
    enviado: 'bg-emerald-100 text-emerald-800',
    error: 'bg-rose-100 text-rose-800',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-200'}`}>
      {status}
    </span>
  );
}

export default function EmailSendReportModal({
  open,
  onClose,
  report,             // [{ id, nombre, email, status, error? }]
  loadingSend,        // bool global
  onRetryFailed,      // () => void
  onRetryOne,         // (id) => void
}) {
  if (!open) return null;

  const total = report.length;
  const enviados = report.filter(r => r.status === 'enviado').length;
  const sinCorreo = report.filter(r => r.status === 'sin correo').length;
  const fallidos = report.filter(r => r.status === 'error').length;
  const pendientes = report.filter(r => r.status === 'pendiente').length;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-lg">Reporte de envío de constancias</h3>
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300"
              disabled={loadingSend}
            >
              Cerrar
            </button>
          </div>

          <div className="p-4">
            <div className="flex flex-wrap gap-2 text-sm mb-3">
              <span className="px-2 py-0.5 bg-gray-100 rounded">Total: <b>{total}</b></span>
              <span className="px-2 py-0.5 bg-emerald-100 rounded">Enviados: <b>{enviados}</b></span>
              <span className="px-2 py-0.5 bg-amber-100 rounded">Sin correo: <b>{sinCorreo}</b></span>
              <span className="px-2 py-0.5 bg-rose-100 rounded">Fallidos: <b>{fallidos}</b></span>
              <span className="px-2 py-0.5 bg-gray-100 rounded">Pendientes: <b>{pendientes}</b></span>
            </div>

            <div className="border rounded max-h-[50vh] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-100">
                  <tr>
                    <th className="p-2 w-10">#</th>
                    <th className="p-2">Nombre</th>
                    <th className="p-2">Correo</th>
                    <th className="p-2 w-28">Estado</th>
                    <th className="p-2">Detalle</th>
                    <th className="p-2 w-20">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map((r, i) => (
                    <tr key={`${r.id}-${i}-${r.email || 'x'}`} className="odd:bg-gray-50">
                      <td className="p-2 text-center">{i + 1}</td>
                      <td className="p-2 break-words">{r.nombre || '—'}</td>
                      <td className="p-2 break-words">{r.email || '—'}</td>
                      <td className="p-2 text-center">
                        <div className="inline-flex items-center gap-1">
                          {r.status === 'pendiente' && <FiLoader className="animate-spin" />}
                          <Pill status={r.status} />
                        </div>
                      </td>
                      <td className="p-2 text-xs text-rose-700 break-words">{r.error || ''}</td>
                      <td className="p-2 text-center">
                        <button
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-blue-600 text-white disabled:opacity-50"
                          title="Reintentar este envío"
                          disabled={loadingSend || r.status === 'enviado' || r.status === 'sin correo'}
                          onClick={()=> onRetryOne?.(r.id)}
                        >
                          <FiRotateCcw /> Reintentar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!report.length && (
                    <tr>
                      <td colSpan={6} className="p-3 text-center text-gray-500">Sin datos</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={onRetryFailed}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm disabled:opacity-60"
                disabled={loadingSend || !report.some(r => r.status === 'error')}
              >
                Reintentar fallidos
              </button>
              {loadingSend && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiLoader className="animate-spin" /> Enviando…
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
