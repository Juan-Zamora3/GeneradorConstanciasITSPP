import React, { useState, useEffect } from 'react';
import ImageCarousel from '../common/ImageCarousel';
import QrCanvas from './QrCanvas'; // si ya lo usas en otras partes; aquí usamos QRCodeCanvas directamente
import { useSurveys } from '../../utilidades/useSurveys';
import { QRCodeCanvas } from 'qrcode.react';
import { doc, updateDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../servicios/firebaseConfig';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { listToWorkbook } from '../../utilidades/excelHelpers';



/** Util: slug del título para el link corto */
function slugify(str = '') {
  return String(str)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // separa por guiones
    .replace(/(^-|-$)+/g, '');   // sin guiones extremos
}

/** Util: base URL (Render → VITE_PUBLIC_BASE_URL) */
function getBaseUrl() {
  // En Render crea un env var: VITE_PUBLIC_BASE_URL = "https://tuapp.onrender.com"
  return import.meta?.env?.VITE_PUBLIC_BASE_URL || window.location.origin;
}

export default function DetailsModal({
  isOpen,
  onClose,
  data = {},
  type = 'course',
  onDelete,
}) {
  const [activeTab, setActiveTab] = useState('cuestionario');

  // === Encuestas ===
  const { getByCourse, createForCourse } = useSurveys();
  const [encuestaLink, setEncuestaLink] = useState('');
  const [encuestaId, setEncuestaId] = useState('');
  const [creatingSurvey, setCreatingSurvey] = useState(false);

  // Mostrar/ocultar QR
  const [showQR, setShowQR] = useState(false);

  // Editor de pantalla (tema del formulario público) — se mantiene en estado, pero ya no se muestra UI
  const [theme, setTheme] = useState({
    backgroundColor: '#f5f7fb',
    backgroundImage: '',
    titleColor: '#111827',
    textColor: '#374151',
    overlayOpacity: 0.35, // 0–1
  });

  const isGroupCourse = data?.tipoCurso === 'grupos';

  // Asegura que el tema inicial provenga de la configuración del curso
  useEffect(() => {
    if (!isOpen) return;
    if (data?.theme) setTheme(t => ({ ...t, ...data.theme }));
  }, [isOpen, data?.theme]);

  // Cargar encuesta si ya existe para este curso
  useEffect(() => {
    if (!isOpen || !data?.id) return;
    (async () => {
      try {
        const list = await getByCourse(data.id);
        if (list?.length) {
          const enc = list[0];
          setEncuestaId(enc.id);
          setEncuestaLink(enc.link || '');
          // si ya guardaste theme antes, cárgalo
          if (enc.theme) setTheme(t => ({ ...t, ...enc.theme }));
        } else {
          setEncuestaId('');
          setEncuestaLink('');
        }
      } catch (e) {
        console.error('loadSurvey error', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, data?.id, getByCourse]);

  // Mapeo de preguntas desde la config del curso (NO usa "form" ni "initialData")
  const mapPreguntasForSurvey = () => {
    const tipoMap = {
      abierta: 'text',
      combobox: 'select',
      multiple: 'radio',
      checklist: 'checkbox',
    };
    const preguntas = data?.formularioGrupos?.preguntasPersonalizadas || [];
    return preguntas.map((p, i) => ({
      id: `p${i + 1}`,
      etiqueta: p.titulo?.trim() || `Pregunta ${i + 1}`,
      tipo: tipoMap[p.tipo] || 'text',
      opciones: Array.isArray(p.opciones) ? p.opciones.filter(Boolean) : [],
      requerida: !!p.requerida,
    }));
  };

  /** Genera/actualiza la encuesta y construye un link corto por slug */
  const generarEncuesta = async () => {
    if (!data?.id) {
      alert('Primero guarda el curso para poder generar el link.');
      return;
    }
    setCreatingSurvey(true);
    try {
      let id = encuestaId;
      let link = encuestaLink;

      if (!id) {
        const preguntas = mapPreguntasForSurvey();
        const res = await createForCourse({
  cursoId: data.id,
  titulo: `Registro de Grupos – ${data.titulo || ''}`,
  descripcion: data.descripcion || '',
  preguntas,
  theme,
  user: null,
  // 🔽 añade:
  cantidadParticipantes: data.formularioGrupos?.cantidadParticipantes ?? 1,
  camposPreestablecidos: data.formularioGrupos?.camposPreestablecidos ?? {
    nombreEquipo: true,
    nombreLider: true,
    contactoEquipo: true,
    cantidadParticipantes: true,
  },
});
        id = res.id;
        
      }

      // Construye link corto con slug
      const slug = slugify(data.titulo || `curso-${data.id?.slice?.(0, 6) || ''}`);
      const base = getBaseUrl();
      link = `${base}/${slug}`;

      // Guardar en colección 'encuestas'
      try {
       await updateDoc(doc(db, 'encuestas', id), {
  link,
  linkSlug: slug,
  theme,
  titulo: `Registro de Grupos – ${data.titulo || ''}`,
  descripcion: data.descripcion || '',
  // 🔽 añade:
  cantidadParticipantes: data.formularioGrupos?.cantidadParticipantes ?? 1,
  camposPreestablecidos: data.formularioGrupos?.camposPreestablecidos ?? {
    nombreEquipo: true,
    nombreLider: true,
    contactoEquipo: true,
    cantidadParticipantes: true,
  },
  updatedAt: new Date(),
});
      } catch (e) {
        console.warn('No se pudo actualizar la encuesta:', e);
      }

      setEncuestaId(id);
      setEncuestaLink(link);

      // Guardar referencia también en el documento del curso (opcional)
      try {
        await updateDoc(doc(db, 'Cursos', data.id), {
          encuestaId: id,
          encuestaLink: link,
          encuestaSlug: slug,
        });
      } catch (e) {
        console.warn('No se pudo actualizar el curso con encuestaId/Link:', e);
      }
    } catch (e) {
      console.error('generarEncuesta error', e);
      alert('No se pudo generar la encuesta');
    } finally {
      setCreatingSurvey(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg ${isGroupCourse ? 'max-w-4xl' : 'max-w-lg'} w-full p-6 space-y-4 overflow-y-auto max-h-full`}>
        {/* ───────────────── HEADER NUEVO ───────────────── */}
        <div className="rounded-2xl bg-gradient-to-r from-[#4A90E2]/10 via-[#00BCD4]/10 to-transparent border border-gray-200 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-200 text-lg">📚</span>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {type === 'course' ? 'Curso' : 'Reporte'}
                </p>
              </div>
              <h2 className="mt-1 text-2xl font-bold leading-tight">{data.titulo || '—'}</h2>
              {type === 'course' && (
                <p className="text-sm text-gray-500">
                  {data.fechaInicio} – {data.fechaFin} · {data.ubicacion}
                </p>
              )}
            </div>

            {type === 'course' && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  {data.categoria || 'Categoría'}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold 
                  ${data.estado === 'proximo' ? 'bg-yellow-100 text-yellow-800'
                    : data.estado === 'en curso' ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'}`}>
                  {data.estado || 'Estado'}
                </span>
                <span className="rounded-full bg-indigo-100 text-indigo-700 px-3 py-1 text-xs font-semibold">
                  {data.tipoCurso === 'grupos' ? 'Por Grupos' : 'Personal'}
                </span>
              </div>
            )}
          </div>

          {type === 'course' && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Chip label="Instructor" value={data.instructor || '—'} icon="👨‍🏫" />
              <Chip label="Participantes" value={data.lista?.length ?? 0} icon="👥" />
              <Chip label="Reportes" value={data.reportes?.length ?? 0} icon="🧾" />
              <Chip label="Ubicación" value={data.ubicacion || '—'} icon="📍" />
            </div>
          )}
        </div>
        {/* ─────────────── FIN HEADER ─────────────── */}

        {type === 'course' ? (
          <>
            {/* ── Layout con datos + QR/Link ─────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Datos del curso */}
              <div className="rounded-2xl border border-gray-200 p-5">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <DLItem k="Fechas" v={`${data.fechaInicio} – ${data.fechaFin}`} />
                  <DLItem k="Categoría" v={data.categoria || '—'} />
                  <div className="sm:col-span-2">
                    <DLItem k="Descripción" v={data.descripcion || '—'} block />
                  </div>
                </dl>

                {/* (Se retiró la UI de “Apariencia de la pantalla del formulario”) */}
              </div>

              {/* QR y Link de registro */}
              <div className="rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">Registro de equipos</h4>
                  <button
                    type="button"
                    onClick={generarEncuesta}
                    disabled={creatingSurvey || !!encuestaLink}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition
                      ${encuestaLink
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                  >
                    {encuestaLink ? 'Link generado' : (creatingSurvey ? 'Generando…' : 'Generar link')}
                  </button>
                </div>

                {/* Botón para mostrar/ocultar QR */}
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={() => setShowQR(v => !v)}
                    disabled={!encuestaLink}
                    className={`px-3 py-2 rounded-md text-sm font-medium border
                      ${encuestaLink ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                  >
                    {showQR ? 'Ocultar QR' : 'Mostrar QR'}
                  </button>
                </div>

                {/* QR (solo si el usuario lo pide) */}
                {showQR && encuestaLink && (
                  <div className="text-center">
                    <div className="inline-block rounded-xl border border-gray-200 bg-white p-4 shadow">
                      <QRCodeCanvas value={encuestaLink} size={220} includeMargin />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Escanéalo para abrir el formulario</p>
                  </div>
                )}

                {/* Caja de link */}
                <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-2">
                    <input
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#00BCD4]/30"
                      readOnly
                      value={encuestaLink || 'Aún no hay link. Genera uno.'}
                    />
                    {encuestaLink && (
                      <>
                        <a
                          href={encuestaLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
                        >
                          Abrir
                        </a>
                        <CopyButton text={encuestaLink} />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Secciones específicas para cursos de grupo (lo tuyo) ───── */}
            {isGroupCourse && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                {/* Pestañas */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
                  <button
                    onClick={() => setActiveTab('cuestionario')}
                    className={`flex-1 px-4 py-2 font-medium text-sm rounded-md transition-all duration-200 ${
                      activeTab === 'cuestionario'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    📋 Información del Cuestionario
                  </button>
                  <button
                    onClick={() => setActiveTab('grupos')}
                    className={`flex-1 px-4 py-2 font-medium text-sm rounded-md transition-all duration-200 ${
                      activeTab === 'grupos'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    👥 Equipos registrados
                  </button>
                </div>

                {/* Contenido pestañas (tu implementación original) */}
                {activeTab === 'cuestionario' && (
                  <CuestionarioPreview data={data} />
                )}
                {activeTab === 'grupos' && (
                  <GruposPreview encuestaId={encuestaId} />
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* ── Datos de reporte ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-2 text-sm">
              <p><strong>Título:</strong> {data.titulo}</p>
              <p><strong>Tipo:</strong> {data.tipo}</p>
              <p><strong>Fecha:</strong> {new Date(data.fecha).toLocaleDateString('es-MX')}</p>
              <p><strong>Descripción:</strong> {data.descripcion}</p>
            </div>

            {data.imagenes?.length > 0 && (
              <div className="pt-3">
                <ImageCarousel images={data.imagenes} />
              </div>
            )}
          </>
        )}

        {/* ── Botones ─────────────────────────────────────────────────────── */}
        <div className="flex justify-end gap-2 pt-4">
          {type === 'report' && onDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Eliminar
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Subcomponentes de presentación ---------- */

function Chip({ label, value, icon }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 p-3 shadow-sm">
      <span>{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
        <p className="truncate text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function DLItem({ k, v, block = false }) {
  return (
    <div className={`rounded-lg bg-gray-50 p-3 ${block ? '' : ''}`}>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{k}</dt>
      <dd className="mt-1 text-gray-900 text-sm">{v}</dd>
    </div>
  );
}

function CopyButton({ text }) {
  const [copiado, setCopiado] = React.useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1200);
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <button
      onClick={copiar}
      className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-100"
    >
      {copiado ? 'Copiado' : 'Copiar'}
    </button>
  );
}

/**
 * Placeholders para no tocar tu UI original.
 */

function CuestionarioPreview({ data }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h4 className="text-xl font-bold text-gray-800 mb-2">📋 Formulario de Registro de Grupos</h4>
        <p className="text-gray-600 text-sm">Configuración del formulario que completarán los equipos</p>
      </div>

      {/* Campos preestablecidos */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white text-sm font-bold">✓</span>
          </div>
          <h5 className="text-lg font-semibold text-blue-800">Campos Preestablecidos</h5>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3"> 
          {data.formularioGrupos?.camposPreestablecidos?.nombreEquipo && (
            <div className="flex items-center bg-white p-3 rounded-lg shadow-sm">
              <span className="text-blue-500 mr-3">🏷️</span>
              <span className="text-gray-700 font-medium">Nombre del Equipo</span>
              <span className="ml-auto text-red-500 text-sm">*</span>
            </div>
          )}
          {data.formularioGrupos?.camposPreestablecidos?.nombreLider && (
            <div className="flex items-center bg-white p-3 rounded-lg shadow-sm">
              <span className="text-blue-500 mr-3">👤</span>
              <span className="text-gray-700 font-medium">Nombre del Líder</span>
              <span className="ml-auto text-red-500 text-sm">*</span>
            </div>
          )}
          {data.formularioGrupos?.camposPreestablecidos?.contactoEquipo && (
            <div className="flex items-center bg-white p-3 rounded-lg shadow-sm">
              <span className="text-blue-500 mr-3">📞</span>
              <span className="text-gray-700 font-medium">Contacto del Equipo</span>
              <span className="ml-auto text-red-500 text-sm">*</span>
            </div>
          )}
          {data.formularioGrupos?.camposPreestablecidos?.cantidadParticipantes && (
           <div className="flex items-center bg-white p-3 rounded-lg shadow-sm">
           <span className="text-blue-500 mr-3">👥</span>
           <span className="text-gray-700 font-medium">Cantidad de Participantes</span>
           <span className="ml-auto text-red-500 text-sm">*</span>
           </div>
          )}
        </div>
      </div>

      {/* Preguntas personalizadas */}
      {data.formularioGrupos?.preguntasPersonalizadas?.length > 0 ? (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white text-sm font-bold">?</span>
            </div>
            <h5 className="text-lg font-semibold text-green-800">Preguntas Personalizadas</h5>
          </div>
          <div className="space-y-4">
            {data.formularioGrupos.preguntasPersonalizadas.map((pregunta, index) => {
              const tipoIconos = { abierta: '📝', combobox: '📋', multiple: '🔘', checklist: '☑️' };
              const tipoTextos = { abierta: 'Respuesta abierta', combobox: 'Lista desplegable', multiple: 'Opción múltiple', checklist: 'Lista de verificación' };
              return (
                <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                  <div className="flex items-start space-x-3">
                    <span className="text-xl">{tipoIconos[pregunta.tipo] || '❓'}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h6 className="font-semibold text-gray-800">
                          {pregunta.titulo}
                          {pregunta.requerida && <span className="text-red-500 ml-1">*</span>}
                        </h6>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                          {tipoTextos[pregunta.tipo] || 'Desconocido'}
                        </span>
                      </div>
                      {pregunta.opciones?.length > 0 && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="mr-2">📊</span>
                          <span>{pregunta.opciones.length} opciones configuradas</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-8 rounded-xl border-2 border-dashed border-gray-200 text-center">
          <div className="text-4xl mb-3">📝</div>
          <h6 className="font-medium text-gray-700 mb-2">Sin preguntas personalizadas</h6>
          <p className="text-gray-500 text-sm">No se han configurado preguntas adicionales para este curso.</p>
        </div>
      )}
    </div>
  );
}

function GruposPreview({ encuestaId }) {
  const [equipos, setEquipos] = useState([]);

  useEffect(() => {
    if (!encuestaId) return;
    const ref = collection(doc(db, 'encuestas', encuestaId), 'respuestas');
    const unsub = onSnapshot(ref, snap => {
      const list = snap.docs.map(d => {
        const info = d.data();
        return {
          id: d.id,
          nombreEquipo: info.preset?.nombreEquipo || '',
          nombreLider: info.preset?.nombreLider || '',
          contactoEquipo: info.preset?.contactoEquipo || '',
          cantidadParticipantes: info.preset?.cantidadParticipantes || '',
          custom: info.custom || {},
          fechaRegistro: info.createdAt?.toDate ? info.createdAt.toDate() : null,
        };
      });
      setEquipos(list);
    });
    return () => unsub();
  }, [encuestaId]);

  const exportExcel = () => {
    const rows = equipos.map(e => ({
      NombreEquipo: e.nombreEquipo,
      NombreLider: e.nombreLider,
      Contacto: e.contactoEquipo,
      CantidadParticipantes: e.cantidadParticipantes,
      ...e.custom,
      FechaRegistro: e.fechaRegistro ? e.fechaRegistro.toLocaleString('es-MX') : '',
    }));
    const wb = listToWorkbook(rows);
    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const file = `equipos-${new Date().toISOString().slice(0, 10)}.xlsx`;
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), file);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h4 className="text-xl font-bold text-gray-800 mb-2">👥 Equipos registrados</h4>
        <div className="flex justify-center items-center space-x-2">
          <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-full text-base font-semibold shadow-lg">
            {equipos.length} {equipos.length === 1 ? 'equipo' : 'equipos'} registrados
          </span>
          {equipos.length > 0 && (
            <button
              onClick={exportExcel}
              className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs font-medium shadow-sm"
            >
              📥 Exportar Excel
            </button>
          )}
        </div>
      </div>

      {equipos.length > 0 ? (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {equipos.map((grupo, index) => (
            <div key={grupo.id} className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    </div>
                    <h5 className="text-lg font-bold text-gray-800">{grupo.nombreEquipo || `Equipo ${index + 1}`}</h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center bg-blue-50 p-2 rounded-lg">
                      <span className="text-blue-500 mr-2">👤</span>
                      <div>
                        <span className="text-xs text-blue-600 font-medium">Líder:</span>
                        <p className="text-sm text-gray-700 font-medium">{grupo.nombreLider || 'No especificado'}</p>
                      </div>
                    </div>
                    <div className="flex items-center bg-green-50 p-2 rounded-lg">
                      <span className="text-green-500 mr-2">📞</span>
                      <div>
                        <span className="text-xs text-green-600 font-medium">Contacto:</span>
                        <p className="text-sm text-gray-700 font-medium">{grupo.contactoEquipo || 'No especificado'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="mr-1">📅</span>
                    <span>
                      Registrado: {grupo.fechaRegistro ? grupo.fechaRegistro.toLocaleDateString('es-MX') : 'Fecha no disponible'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col space-y-2 ml-4">
                  <button className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-medium shadow-sm">👁️ Ver</button>
                  <button className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs font-medium shadow-sm">✏️ Editar</button>
                  <button className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs font-medium shadow-sm">🗑️ Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 p-12 rounded-xl border-2 border-dashed border-gray-200 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h6 className="text-lg font-semibold text-gray-700 mb-2">No hay equipos registrados</h6>
          <p className="text-gray-500 text-sm mb-4">Los equipos aparecerán aquí cuando se registren usando el código QR o el link de registro.</p>
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
            <span className="mr-2">💡</span>
            Comparte el QR o link para que los equipos se registren
          </div>
        </div>
      )}
    </div>
  );
}
