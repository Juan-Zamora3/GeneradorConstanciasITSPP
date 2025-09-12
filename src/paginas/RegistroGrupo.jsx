// src/paginas/RegistroGrupo.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSurveys } from '../utilidades/useSurveys';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../servicios/firebaseConfig';

export default function RegistroGrupo() {
  const { encuestaId, slug } = useParams();
  const { getById, saveResponse } = useSurveys();

  const [encuesta, setEncuesta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState({
    nombreEquipo: '',
    nombreLider: '',
    contactoEquipo: '',
  });
  const [custom, setCustom] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        let s = null;

        if (encuestaId) {
          s = await getById(encuestaId);
        } else if (slug) {
          const q = query(collection(db, 'encuestas'), where('linkSlug', '==', slug));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const d = snap.docs[0];
            s = { id: d.id, ...d.data() };
          }
        }

        if (!mounted) return;

        setEncuesta(s || null);

        // init preguntas custom
        const preguntas =
          s?.preguntas ??
          s?.form?.preguntas ??
          s?.questions ??
          [];

        const init = {};
        preguntas.forEach((p) => {
          init[p.id] = p.tipo === 'checkbox' ? [] : '';
        });
        setCustom(init);
      } catch (err) {
        console.error('Error cargando encuesta:', err);
        setEncuesta(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encuestaId, slug]);

  // Apariencia / theme (con overrides de título y descripción)
  const theme = encuesta?.theme || {};
  const headerTitle = theme.headerTitle || encuesta?.titulo || 'Registro de Grupos';
  const headerDescription = theme.headerDescription || encuesta?.descripcion || 'Completa el formulario de registro.';

  const containerStyle = useMemo(
    () => ({
      backgroundColor: theme.backgroundColor || undefined,
      backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }),
    [theme.backgroundColor, theme.backgroundImage]
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!encuesta) return;
    setEnviando(true);
    try {
      await saveResponse(encuesta.id, { preset, custom, createdAt: new Date() });
      setOk(true);
    } catch (err) {
      console.error('saveResponse error', err);
      alert('No se pudo enviar el registro.');
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return <div className="p-6">Cargando…</div>;
  if (!encuesta) return <div className="p-6">Formulario no encontrado.</div>;
  if (ok) return <div className="p-6 text-green-700">¡Registro enviado! ✅</div>;

  const campos = encuesta.camposPreestablecidos ?? {
    nombreEquipo: true,
    nombreLider: true,
    contactoEquipo: true,
  };

  const preguntas =
    encuesta.preguntas ??
    encuesta.form?.preguntas ??
    encuesta.questions ??
    [];

  return (
    <div className="min-h-screen" style={containerStyle}>
      {theme.backgroundImage && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ background: `rgba(0,0,0,${Number(theme.overlayOpacity ?? 0)})` }}
        />
      )}

      <div className="relative z-10 max-w-3xl mx-auto p-6">
        <div className="rounded-xl bg-white/90 backdrop-blur shadow-xl p-6">
          <h1 className="text-2xl font-semibold mb-2" style={{ color: theme.titleColor || '#111827' }}>
            {headerTitle}
          </h1>
          <p className="text-sm mb-6" style={{ color: theme.textColor || '#374151' }}>
            {headerDescription}
          </p>

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Campos preestablecidos */}
            {campos.nombreEquipo && (
              <div>
                <label className="block text-sm mb-1" style={{ color: theme.textColor || '#374151' }}>
                  Nombre del Equipo *
                </label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={preset.nombreEquipo}
                  onChange={(e) => setPreset((p) => ({ ...p, nombreEquipo: e.target.value }))}
                  required
                />
              </div>
            )}

            {campos.nombreLider && (
              <div>
                <label className="block text-sm mb-1" style={{ color: theme.textColor || '#374151' }}>
                  Nombre del Líder *
                </label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={preset.nombreLider}
                  onChange={(e) => setPreset((p) => ({ ...p, nombreLider: e.target.value }))}
                  required
                />
              </div>
            )}

            {campos.contactoEquipo && (
              <div>
                <label className="block text-sm mb-1" style={{ color: theme.textColor || '#374151' }}>
                  Contacto del Equipo *
                </label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={preset.contactoEquipo}
                  onChange={(e) => setPreset((p) => ({ ...p, contactoEquipo: e.target.value }))}
                  required
                />
              </div>
            )}

            {/* Preguntas personalizadas */}
            {preguntas.map((p) => (
              <div key={p.id}>
                <label className="block text-sm mb-1" style={{ color: theme.textColor || '#374151' }}>
                  {p.etiqueta} {p.requerida ? '*' : ''}
                </label>

                {p.tipo === 'text' && (
                  <input
                    className="border rounded px-3 py-2 w-full"
                    value={custom[p.id] ?? ''}
                    onChange={(e) => setCustom((c) => ({ ...c, [p.id]: e.target.value }))}
                    required={!!p.requerida}
                  />
                )}

                {p.tipo === 'select' && (
                  <select
                    className="border rounded px-3 py-2 w-full"
                    value={custom[p.id] ?? ''}
                    onChange={(e) => setCustom((c) => ({ ...c, [p.id]: e.target.value }))}
                    required={!!p.requerida}
                  >
                    <option value="">Seleccione…</option>
                    {(p.opciones || []).map((op) => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                )}

                {p.tipo === 'radio' && (
                  <div className="space-y-1">
                    {(p.opciones || []).map((op) => (
                      <label key={op} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={p.id}
                          checked={custom[p.id] === op}
                          onChange={() => setCustom((c) => ({ ...c, [p.id]: op }))}
                          required={!!p.requerida}
                        />
                        {op}
                      </label>
                    ))}
                  </div>
                )}

                {p.tipo === 'checkbox' && (
                  <div className="space-y-1">
                    {(p.opciones || []).map((op) => {
                      const arr = Array.isArray(custom[p.id]) ? custom[p.id] : [];
                      const checked = arr.includes(op);
                      return (
                        <label key={op} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = new Set(arr);
                              e.target.checked ? next.add(op) : next.delete(op);
                              setCustom((c) => ({ ...c, [p.id]: Array.from(next) }));
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
      </div>
    </div>
  );
}
