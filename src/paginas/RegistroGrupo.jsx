import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  collection, query, where, limit, onSnapshot, doc, getDoc,
} from 'firebase/firestore';
import { db } from '../servicios/firebaseConfig';
import { saveResponse } from '../utilidades/useSurveys';

// helpers: clamp01, nonEmpty, resizeArray…
function clamp01(n) {
  const x = Number(n);
  return Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : null;
}

function nonEmpty(v) {
  // convierte '' en undefined para que los fallback funcionen
  return typeof v === 'string' && v.trim() === '' ? undefined : v;
}

function resizeArray(arr, len, fill = '') {
  const a = Array.isArray(arr) ? arr.slice(0, len) : [];
  while (a.length < len) a.push(fill);
  return a;
}

export default function RegistroGrupo() {
  // URL params
  const { encuestaId, slug } = useParams();

  // ----- STATES (siempre antes de cualquier return) -----
  const [encuesta,       setEncuesta]       = useState(null);
  const [formAppearance, setFormAppearance] = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [preset,         setPreset]         = useState({
    nombreEquipo: '', nombreLider: '', contactoEquipo: '', categoria: '',
    cantidadParticipantes: 1, integrantes: [''],
  });
  const [categorias,     setCategorias]     = useState([]);
  const [custom,         setCustom]         = useState({});
  const [enviando,       setEnviando]       = useState(false);
  const [ok,             setOk]             = useState(false);

  // Cupo depende de encuesta -> calcúlalo DESPUÉS de declarar encuesta
  const cupo = useMemo(() => (
    encuesta?.cantidadParticipantes ??
    encuesta?.formularioGrupos?.cantidadParticipantes ?? 1
  ), [encuesta]);

  // Ajusta preset cuando cambia encuesta/cupo (solo UNO de estos effects)
  useEffect(() => {
    setPreset(p => ({
      ...p,
      cantidadParticipantes: cupo,
      integrantes: resizeArray(p.integrantes, cupo),
    }));
    setOk(false);
    setFormAppearance(null);
  }, [encuesta?.id, cupo]);// Cada vez que cambie la encuesta o el cupo, ajusta el preset


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

  // Al cambiar de encuesta, limpia estados visibles
  useEffect(() => {
  setPreset(p => ({
    ...p,
    nombreEquipo: '',
    nombreLider: '',
    contactoEquipo: '',
    categoria: '',
  }));
  setOk(false);
  setFormAppearance(null);
}, [encuesta?.id]);

  // Carga apariencia global desde formularios/{formId|cursoId|courseId} (si existe) y la mezcla
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const formId = encuesta?.formId || encuesta?.cursoId || encuesta?.courseId;
      if (!formId) {
        setFormAppearance(null);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'formularios', formId)); // cambia 'formularios' si tu colección se llama distinto
        const data = snap.exists() ? (snap.data()?.appearance || {}) : {};
        if (!cancelled) setFormAppearance(data);
      } catch (e) {
        console.error('getDoc formularios error', e);
        if (!cancelled) setFormAppearance(null);
      }
    })();
    return () => { cancelled = true; };
  }, [encuesta?.formId, encuesta?.cursoId, encuesta?.courseId]);

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

  // Re-inicializa campos preestablecidos cuando cambia su configuración
  useEffect(() => {
    setPreset({ nombreEquipo: '', nombreLider: '', contactoEquipo: '', categoria: '' });
  setOk(false);
  }, [
    encuesta?.camposPreestablecidos?.nombreEquipo,
    encuesta?.camposPreestablecidos?.nombreLider,
    encuesta?.camposPreestablecidos?.contactoEquipo,
    encuesta?.camposPreestablecidos?.categoria,
   // ⬅️ asegura reset si cambian
  ]);


  // Cargar categorías existentes para sugerencias
  useEffect(() => {
    if (!encuesta?.id) return;
    const ref = collection(doc(db, 'encuestas', encuesta.id), 'respuestas');
    const unsub = onSnapshot(ref, snap => {
      const setCat = new Set(encuesta.formularioGrupos?.categorias || []);
      snap.forEach(d => {
        const cat = d.data()?.preset?.categoria;
        if (cat) setCat.add(cat);
      });
      setCategorias([...setCat]);
    });
    return () => unsub();

  }, [encuesta?.id, encuesta?.formularioGrupos?.categorias]);


  const theme = useMemo(() => {
    const raw = {
      ...(formAppearance || {}),
      ...(encuesta?.theme || encuesta?.appearance || encuesta?.apariencia || {}),
    };
    const t = {
      headerTitle:       nonEmpty(raw.headerTitle),
      headerDescription: nonEmpty(raw.headerDescription),
      backgroundColor:   nonEmpty(raw.backgroundColor),
      titleColor:        nonEmpty(raw.titleColor),
      textColor:         nonEmpty(raw.textColor),
      // si no hay valor numérico válido, usa 0.35 por defecto
      overlayOpacity:    (v => (v ?? 0.35))(clamp01(nonEmpty(raw.overlayOpacity))),
      
      backgroundImage:   nonEmpty(raw.backgroundImage),
      
      bgVersion:         raw.bgVersion || 0,
    };


    // URL final del fondo:
    // - si es http(s) => se aplica cache-buster ?v=
    // - si es data: o blob: => se deja intacta (no añadir query)
    let bgUrl = undefined;
    if (t.backgroundImage) {
      const s = String(t.backgroundImage);
      if (/^https?:\/\//i.test(s)) {
        bgUrl = `${s}${s.includes('?') ? '&' : '?'}v=${t.bgVersion}`;
      } else if (/^(data:|blob:)/i.test(s)) {
        bgUrl = s; // NO tocar
      } else {
        // Valor no reconocido -> mejor no usarlo
        bgUrl = undefined;
      }
    }

    return { ...t, _bgUrl: bgUrl };
  }, [encuesta, formAppearance]);

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
      // 'none' asegura que se borre el fondo previo si no hay imagen
      backgroundImage: theme._bgUrl ? `url("${theme._bgUrl}")` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }),
    [theme.backgroundColor, theme._bgUrl]
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

  if (loading)   return <div className="p-6">Cargando…</div>;
  if (!encuesta) return <div className="p-6">Formulario no encontrado.</div>;
  if (ok)
    return (
      <div className="min-h-screen" style={containerStyle}>
        {theme._bgUrl && theme.overlayOpacity > 0 && (
          <div
            className="fixed inset-0 pointer-events-none"
            style={{ background: `rgba(0,0,0,${theme.overlayOpacity})` }}
          />
        )}
        <div className="relative z-10 flex items-center justify-center max-w-3xl mx-auto p-6">
          <div className="rounded-xl bg-white/90 backdrop-blur shadow-xl p-10 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-semibold mb-2">¡Registro enviado!</h2>
            <p className="text-gray-600">Gracias por registrar tu equipo.</p>

          </div>
        </div>
      </div>
    );
  

  const campos = encuesta.camposPreestablecidos ?? {
    nombreEquipo: true,
    nombreLider: true,
    contactoEquipo: true,
    categoria: true,
    cantidadParticipantes: true,
  };

 

  return (
    // key fuerza remount al cambiar de encuesta y evita “heredar” estado/estilos
    <div key={encuesta.id} className="min-h-screen" style={containerStyle}>
      {theme._bgUrl && theme.overlayOpacity > 0 && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ background: `rgba(0,0,0,${theme.overlayOpacity})` }}
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

          {/* Descripción editable */}
          <p className="text-sm mb-6" style={{ color: theme.textColor || '#374151' }}>
            {headerDescription}
          </p>

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Campos preestablecidos */}
            {campos.nombreEquipo && (
              <div>
                <label className="block text-sm mb-1" style={{ color: theme.textColor || '#374151' }}>
                   Nombre del Equipo. (El nombre no debe contener palabras o denominaciones que se consideren inapropiadas). *
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
                  Nombre del líder del equipo. (Importante: este dato se utilizará para generar su constancia de participación) *
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
      Correo del Equipo (para recibir la constancia) *
    </label>
    <input
      type="email"
      inputMode="email"
      autoComplete="email"
      placeholder="nombre@dominio.com"
      className="border rounded px-3 py-2 w-full"
      value={preset.contactoEquipo}
      onChange={(e) => setPreset((p) => ({ ...p, contactoEquipo: e.target.value }))}
      required
      pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
      title="Ingresa un correo válido, por ejemplo nombre@dominio.com"
      onInvalid={(e) =>
        e.currentTarget.setCustomValidity('Ingresa un correo válido (ej. nombre@dominio.com).')
      }
      onInput={(e) => e.currentTarget.setCustomValidity('')}
    />
   
  </div>
)}
            {campos.categoria && (
              <div>
                <label className="block text-sm mb-1" style={{ color: theme.textColor || '#374151' }}>
                  Categoría *
                </label>
                {categorias.length > 0 ? (
                  <select
                    className="border rounded px-3 py-2 w-full"
                    value={preset.categoria}
                    onChange={(e) => setPreset((p) => ({ ...p, categoria: e.target.value }))}
                    required
                  >
                    <option value="">Seleccione una categoría</option>
                    {categorias.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="border rounded px-3 py-2 w-full"
                    value={preset.categoria}
                    onChange={(e) => setPreset((p) => ({ ...p, categoria: e.target.value }))}
                    required
                  />
                )}
              </div>
            )}

            {campos.cantidadParticipantes && cupo > 0 && (
              <div className="space-y-4">
                {Array.from({ length: cupo }).map((_, i) => (
                  <div key={i}>
                    <label className="block text-sm mb-1" style={{ color: theme.textColor || '#374151' }}>
                      Integrante {i + 1}
                    </label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={preset.integrantes?.[i] ?? ''}
                      onChange={(e) =>
                        setPreset(p => {
                          const next = resizeArray(p.integrantes, cupo);
                          next[i] = e.target.value;
                          return { ...p, integrantes: next };
                        })
                      }
                      required
                    />
                  </div>
                ))}
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
