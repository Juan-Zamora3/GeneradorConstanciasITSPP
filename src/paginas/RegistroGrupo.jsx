// src/paginas/RegistroGrupo.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  collection,
  query,
  where,
  limit,
  onSnapshot,
  doc,
} from 'firebase/firestore';
import { db } from '../servicios/firebaseConfig';

// ⬅️ Import estático (recomendado)
import { saveResponse } from '../utilidades/useSurveys';

export default function RegistroGrupo() {
  // Soporta ambos esquemas de URL: /registro/:encuestaId  y  /:slug
  const { encuestaId, slug } = useParams();

  const [encuesta, setEncuesta] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [preset, setPreset]     = useState({
    nombreEquipo: '',
    nombreLider: '',
    contactoEquipo: '',
  });
  const [custom, setCustom]     = useState({});
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk]             = useState(false);

  // === Suscripción en tiempo real a la encuesta ===
  useEffect(() => {
    setLoading(true);
    let unsub = () => {};

    if (encuestaId) {
      const ref = doc(db, 'encuestas', encuestaId);
      unsub = onSnapshot(
        ref,
        (snap) => {
          setEncuesta(snap.exists() ? { id: snap.id, ...snap.data() } : null);
          setLoading(false);
        },
        (err) => {
          console.error('onSnapshot encuestaId:', err);
          setEncuesta(null);
          setLoading(false);
        }
      );
    } else if (slug) {
      const q = query(
        collection(db, 'encuestas'),
        where('linkSlug', '==', slug),
        limit(1)
      );
      unsub = onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            const d = snap.docs[0];
            setEncuesta({ id: d.id, ...d.data() });
          } else {
            setEncuesta(null);
          }
          setLoading(false);
        },
        (err) => {
          console.error('onSnapshot slug:', err);
          setEncuesta(null);
          setLoading(false);
        }
      );
    } else {
      setEncuesta(null);
      setLoading(false);
    }

    return () => unsub();
  }, [encuestaId, slug]);

  // Normaliza preguntas desde diferentes claves
  const preguntas = useMemo(() => {
    const s = encuesta || {};
    return s.preguntas ?? s.form?.preguntas ?? s.questions ?? [];
  }, [encuesta]);

  // Re-inicializa respuestas custom cuando cambia la estructura de preguntas
  useEffect(() => {
    const init = {};
    preguntas.forEach((p) => {
      init[p.id] = p.tipo === 'checkbox' ? [] : '';
    });
    setCustom(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(preguntas.map((p) => `${p.id}:${p.tipo}`))]);

  // Normaliza theme/appearance
  const theme = useMemo(() => {
    const s = encuesta || {};
    return s.theme || s.appearance || s.apariencia || {};
  }, [encuesta]);

  // Título/Descripción visibles (también acepta encuesta.titulo/descripcion)
  const headerTitle =
    theme.headerTitle ||
    encuesta?.titulo ||
    'Registro de Grupos';

  const headerDescription =
    theme.headerDescription ||
    encuesta?.descripcion ||
    'Completa el formulario de registro.';

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
      await saveResponse(encuesta.id, {
        preset,
        custom,
        createdAt: new Date(),
      });
      setOk(true);
    } catch (err) {
      console.error('saveResponse error', err);
      alert('No se pudo enviar el registro.');
    } finally {
      setEnviando(false);
    }
  };

  if (loading)     return <div className="p-6">Cargando…</div>;
  if (!encuesta)   return <div className="p-6">Formulario no encontrado.</div>;
  if (ok)          return <div className="p-6 text-green-700">¡Registro enviado! ✅</div>;

  const campos = encuesta.camposPreestablecidos ?? {
    nombreEquipo: true,
    nombreLider: true,
    contactoEquipo: true,
  };

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
          <h1
            className="text-2xl font-semibold mb-2"
            style={{ color: theme.titleColor || '#111827' }}
          >
            {headerTitle}
          </h1>

          {/* ✅ Descripción editable */}
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
                      <option key={op} value={op}>
                        {op}
                      </option>
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
