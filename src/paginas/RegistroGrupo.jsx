// src/paginas/RegistroGrupo.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSurveys } from '../utilidades/useSurveys';

export default function RegistroGrupo() {
  const { encuestaId } = useParams();
  const { getById, saveResponse } = useSurveys();

  const [encuesta, setEncuesta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState({ nombreEquipo:'', nombreLider:'', contactoEquipo:'' });
  const [custom, setCustom] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const s = await getById(encuestaId);
      setEncuesta(s);
      // inicializar respuestas custom
      const init = {};
      (s?.preguntas || []).forEach(p => { init[p.id] = ''; });
      setCustom(init);
      setLoading(false);
    })();
  }, [encuestaId, getById]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!encuesta) return;
    setEnviando(true);
    try {
      await saveResponse(encuesta.id, { preset, custom });
      setOk(true);
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return <div className="p-6">Cargando…</div>;
  if (!encuesta) return <div className="p-6">Encuesta no encontrada.</div>;
  if (ok) return <div className="p-6 text-green-700">¡Registro enviado! ✅</div>;

  const campos = encuesta.camposPreestablecidos ?? {
    nombreEquipo: true, nombreLider: true, contactoEquipo: true,
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">{encuesta.titulo || 'Registro de Grupos'}</h1>
      <form onSubmit={onSubmit} className="space-y-6">

        {/* Campos preestablecidos */}
        {campos.nombreEquipo && (
          <div>
            <label className="block text-sm mb-1">Nombre del Equipo *</label>
            <input className="border rounded px-3 py-2 w-full"
              value={preset.nombreEquipo}
              onChange={e=>setPreset(p=>({...p, nombreEquipo:e.target.value}))}
              required
            />
          </div>
        )}
        {campos.nombreLider && (
          <div>
            <label className="block text-sm mb-1">Nombre del Líder *</label>
            <input className="border rounded px-3 py-2 w-full"
              value={preset.nombreLider}
              onChange={e=>setPreset(p=>({...p, nombreLider:e.target.value}))}
              required
            />
          </div>
        )}
        {campos.contactoEquipo && (
          <div>
            <label className="block text-sm mb-1">Contacto del Equipo *</label>
            <input className="border rounded px-3 py-2 w-full"
              value={preset.contactoEquipo}
              onChange={e=>setPreset(p=>({...p, contactoEquipo:e.target.value}))}
              required
            />
          </div>
        )}

        {/* Preguntas personalizadas */}
        {(encuesta.preguntas || []).map(p => (
          <div key={p.id}>
            <label className="block text-sm mb-1">
              {p.etiqueta} {p.requerida ? '*' : ''}
            </label>

            {p.tipo === 'text' && (
              <input
                className="border rounded px-3 py-2 w-full"
                value={custom[p.id] ?? ''}
                onChange={e=>setCustom(c=>({...c, [p.id]: e.target.value}))}
                required={!!p.requerida}
              />
            )}

            {p.tipo === 'select' && (
              <select
                className="border rounded px-3 py-2 w-full"
                value={custom[p.id] ?? ''}
                onChange={e=>setCustom(c=>({...c, [p.id]: e.target.value}))}
                required={!!p.requerida}
              >
                <option value="">Seleccione…</option>
                {(p.opciones||[]).map(op=><option key={op} value={op}>{op}</option>)}
              </select>
            )}

            {p.tipo === 'radio' && (
              <div className="space-y-1">
                {(p.opciones||[]).map(op=>(
                  <label key={op} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={p.id}
                      checked={custom[p.id] === op}
                      onChange={()=>setCustom(c=>({...c, [p.id]: op}))}
                      required={!!p.requerida}
                    />
                    {op}
                  </label>
                ))}
              </div>
            )}

            {p.tipo === 'checkbox' && (
              <div className="space-y-1">
                {(p.opciones||[]).map(op=>{
                  const arr = Array.isArray(custom[p.id]) ? custom[p.id] : [];
                  const checked = arr.includes(op);
                  return (
                    <label key={op} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={e=>{
                          const next = new Set(arr);
                          e.target.checked ? next.add(op) : next.delete(op);
                          setCustom(c=>({...c, [p.id]: Array.from(next)}));
                        }}
                      />
                      {op}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        <button
          disabled={enviando}
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {enviando ? 'Enviando…' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}
