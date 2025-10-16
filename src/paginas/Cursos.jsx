// src/paginas/Cursos.jsx
import React, { useState, useContext, useEffect, useRef } from 'react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { listToWorkbook, fileToList } from '../utilidades/excelHelpers';

import { useCourses } from '../utilidades/useCourses';
import { useReports } from '../utilidades/useReports';

import CourseListItem from '../componentes/PantallaCursos/CourseListItem';
import ReportListItem from '../componentes/PantallaCursos/ReportListItem';
import CourseModal from '../componentes/PantallaCursos/CourseModal';
import ReportModal from '../componentes/PantallaCursos/ReportModal';
import DetailsModal from '../componentes/PantallaCursos/DetailsModal';

import { AuthContext } from '../contexto/AuthContext';

// Firestore para listar Plantillas
import { db } from '../servicios/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

// Borrado en cascada (curso + encuestas)
import { deleteCourseAndSurveys } from '../servicios/cursos';

// Constancias (asociar plantilla al curso preservando campos)
import { getConfigConstancia, setCursoConstancia } from '../servicios/constancias';

/* ---------------- VALIDADORES BÁSICOS ---------------- */
function validateCourse(c) {
  const errs = [];
  if (!c?.titulo?.trim()) errs.push('Título obligatorio');
  if (!c?.instructor?.trim()) errs.push('Instructor obligatorio');
  if (!c?.fechaInicio?.trim()) errs.push('Fecha de inicio obligatoria');
  return errs;
}
function validateReport(r) {
  const errs = [];
  if (!r?.titulo?.trim()) errs.push('Título obligatorio');
  if (!r?.tipo?.trim()) errs.push('Tipo obligatorio');
  if (!r?.cursoId?.trim()) errs.push('Curso asociado obligatorio');
  return errs;
}

/* -------------------------------------------------------------- */
export default function Cursos() {
  const { usuario } = useContext(AuthContext);
  const canManageCourses = usuario?.role !== 'user';

  /* ----------- data hooks ----------- */
  const { courses, loading: lc, createCourse, updateCourse /* deleteCourse */ } = useCourses();
  const { reports, loading: lr, createReport, updateReport, deleteReport } = useReports();

  /* ----------- UI state ----------- */
  const [view, setView] = useState('courses'); // courses | reports
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('titulo');
  const [filterCat, setFilterCat] = useState('');

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editCourse, setEditCourse] = useState(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [editReport, setEditReport] = useState(null);

  const [showDetail, setShowDetail] = useState(false);
  const [detailData, setDetailData] = useState({});
  const [detailType, setDetailType] = useState('course');

  const importRef = useRef(null);

  // ids en eliminación (deshabilita botón mientras borra)
  const [deletingIds, setDeletingIds] = useState(() => new Set());
  const isDeleting = (id) => deletingIds.has(id);

  /* ----------- cursos filtrados ----------- */
  const filteredCourses = (() => {
    let arr = Array.isArray(courses) ? courses : [];
    if (search.trim()) {
      const t = search.toLowerCase();
      arr = arr.filter(
        (c) =>
          (c?.titulo ?? '').toLowerCase().includes(t) ||
          (c?.instructor ?? '').toLowerCase().includes(t)
      );
    }
    if (filterCat) arr = arr.filter((c) => c?.categoria === filterCat);
    return [...arr].sort((a, b) =>
      String(a?.[sortBy] ?? '').localeCompare(String(b?.[sortBy] ?? ''))
    );
  })();

  /* =============== EXCEL: export / import =============== */
  const exportList = () => {
    const list = view === 'courses' ? courses : reports;
    const wb = listToWorkbook(list || []);
    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const today = new Date();
    const file = `${view === 'courses' ? 'Cursos' : 'Reportes'}-${today
      .toISOString()
      .slice(0, 10)}.xlsx`;
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), file);
    toast.success('Excel exportado');
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await fileToList(file);

      let nuevos = 0,
        actualizados = 0,
        errores = 0;
      if (view === 'courses') {
        for (const r of rows) {
          const fails = validateCourse(r);
          if (fails.length) {
            errores++;
            continue;
          }

          const match = courses.find(
            (c) => c.titulo === r.titulo && c.fechaInicio === r.fechaInicio
          );
          if (match) {
            await updateCourse(match.id, r, r.imagen);
            actualizados++;
          } else {
            await createCourse(r, r.imagen);
            nuevos++;
          }
        }
      } else {
        for (const r of rows) {
          const fails = validateReport(r);
          if (fails.length) {
            errores++;
            continue;
          }

          const match = reports.find((rep) => rep.id === r.id);
          if (match) {
            await updateReport(match.id, r, r.imagenes);
            actualizados++;
          } else {
            await createReport(r.cursoId, r, r.imagenes || []);
            nuevos++;
          }
        }
      }

      toast.success(
        `Importado • ${nuevos} nuevos • ${actualizados} actualizados${
          errores ? ` • ${errores} con error` : ''
        }`
      );
      if (errores) toast.warn('Revisa filas con datos faltantes');
    } catch (err) {
      console.error(err);
      toast.error('Error al importar');
    }
    e.target.value = '';
  };

  /* ----------- export automático día 1 ----------- */
  useEffect(() => {
    const listReady = view === 'courses' ? (courses?.length || 0) : (reports?.length || 0);
    if (!listReady) return;

    const today = new Date();
    if (today.getDate() !== 1) return;

    const key = `lastExport-${view}`;
    const tag = `${today.getFullYear()}-${today.getMonth()}`;
    if (localStorage.getItem(key) === tag) return;

    exportList();
    localStorage.setItem(key, tag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, reports]);

  /* ================== ASIGNAR CONSTANCIA ================== */
  const [showPickConstancia, setShowPickConstancia] = useState(false);
  const [targetCourse, setTargetCourse] = useState(null);

  const [plantillas, setPlantillas] = useState([]);
  const [loadingPlantillas, setLoadingPlantillas] = useState(false);
  const [pickSearch, setPickSearch] = useState('');

  // abrir modal y suscribirse a Plantillas
  const openPickModal = (course) => {
    setTargetCourse(course);
    setShowPickConstancia(true);
    setLoadingPlantillas(true);

    const q = query(collection(db, 'Plantillas'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPlantillas(list);
        setLoadingPlantillas(false);
      },
      (err) => {
        console.error(err);
        setLoadingPlantillas(false);
        toast.error('No se pudieron cargar las constancias');
      }
    );

    // limpiar suscripción cuando se cierre el modal:
    const stop = () => unsub();
    // guardamos un método en ventana para cerrar (se elimina al cerrar modal)
    window.__unsubPlantillas = stop;
  };

  const closePickModal = () => {
    setShowPickConstancia(false);
    setTargetCourse(null);
    setPickSearch('');
    setPlantillas([]);
    if (typeof window.__unsubPlantillas === 'function') {
      try { window.__unsubPlantillas(); } catch {}
      delete window.__unsubPlantillas;
    }
  };

  const filteredPlantillas = (() => {
    if (!pickSearch.trim()) return plantillas;
    const t = pickSearch.toLowerCase();
    return plantillas.filter(p =>
      (p?.nombre ?? '').toLowerCase().includes(t) ||
      (p?.storagePath ?? '').toLowerCase().includes(t)
    );
  })();

  const handleAssignPlantilla = async (p) => {
    if (!targetCourse?.id || !p?.id) return;
    try {
      // preservar campos/tamaños existentes si ya estaban en el curso
      const actual = await getConfigConstancia(targetCourse.id); // {plantilla, campos}
      const campos = Array.isArray(actual?.campos) ? actual.campos : [];

      await setCursoConstancia(
        targetCourse.id,
        {
          plantilla: {
            plantillaId: p.id,
            nombre: p.nombre || 'Plantilla',
            url: p.url,
            storagePath: p.storagePath,
          },
          campos // se preservan tal cual
        },
        usuario?.email || usuario?.correo
      );

      toast.success(`Constancia asignada a "${targetCourse.titulo}"`);
      closePickModal();
    } catch (e) {
      console.error(e);
      toast.error('No se pudo asignar la constancia al curso');
    }
  };

  /* ----------- handlers de reportes ----------- */
  const handleSaveReport = async (data, imgs) => {
    const fails = validateReport(data);
    if (fails.length) {
      toast.error(fails.join('\n'));
      return;
    }

    try {
      if (editReport) await updateReport(editReport.id, data, imgs);
      else await createReport(data.cursoId, data, imgs);
      toast.success('Reporte guardado');
      setShowReportModal(false);
      setEditReport(null);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el reporte');
    }
  };

  const handleDeleteReport = async (rep) => {
    if (!window.confirm('¿Eliminar reporte?')) return;
    try {
      await deleteReport(rep.id);
      toast.info('Reporte eliminado');
      setShowDetail(false);
    } catch (e) {
      console.error(e);
      toast.error('No se pudo eliminar el reporte');
    }
  };

  const handleDeleteCourse = async (c) => {
    if (!c?.id) return;
    if (!window.confirm('¿Eliminar curso y sus encuestas asociadas?')) return;

    setDeletingIds((s) => new Set(s).add(c.id));
    try {
      // Borrado en batch: curso + encuestas
      await deleteCourseAndSurveys(c.id);
      toast.info('Curso eliminado (incluidas encuestas asociadas)');
      if (showDetail && detailType === 'course' && detailData?.id === c.id) {
        setShowDetail(false);
      }
    } catch (e) {
      console.error(e);
      toast.error('No se pudo eliminar el curso');
    } finally {
      setDeletingIds((s) => {
        const next = new Set(s);
        next.delete(c.id);
        return next;
      });
    }
  };

  /* -------------------------------------------------- render */
  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
        <h2 className="text-2xl font-semibold">Gestión de Cursos</h2>

        <div className="flex flex-wrap gap-2">
          {/* Import / Export */}
          <button
            onClick={() => importRef.current?.click()}
            className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 flex items-center"
          >
            <i className="ri-upload-2-line mr-1" /> Importar Excel
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImport}
            className="hidden"
          />

          <button
            onClick={exportList}
            className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 flex items-center"
          >
            <i className="ri-download-2-line mr-1" /> Exportar Excel
          </button>

          {/* Nuevo Reporte */}
          <button
            onClick={() => {
              setEditReport(null);
              setShowReportModal(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Nuevo Reporte
          </button>

          {/* Nuevo Curso */}
          {canManageCourses && (
            <button
              onClick={() => {
                setEditCourse(null);
                setShowCourseModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Nuevo Curso
            </button>
          )}
        </div>
      </div>

      {/* TOGGLE */}
      <div className="flex gap-2 mb-6">
        {['courses', 'reports'].map((key) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`px-4 py-2 rounded ${
              view === key ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            {key === 'courses' ? 'Cursos' : 'Reportes'}
          </button>
        ))}
      </div>

      {/* === LISTAS === */}
      {view === 'courses' ? (
        /* CURSOS */
        <>
          {/* filtros */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              placeholder="Buscar cursos…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="titulo">Ordenar por título</option>
              <option value="fechaInicio">Ordenar por fecha</option>
            </select>
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las categorías</option>
              <option value="informatica">Informática</option>
              <option value="administracion">Administración</option>
            </select>
          </div>

          {lc ? (
            <p>Cargando cursos…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredCourses.map((c) => (
                <div key={c.id} className="flex flex-col gap-2">
                  <CourseListItem
                    course={c}
                    deleting={isDeleting(c.id)}
                    onView={() => {
                      setDetailData(c);
                      setDetailType('course');
                      setShowDetail(true);
                    }}
                    onEdit={
                      canManageCourses
                        ? () => {
                            setEditCourse(c);
                            setShowCourseModal(true);
                          }
                        : undefined
                    }
                    onDelete={
                      canManageCourses
                        ? () => handleDeleteCourse(c)
                        : undefined
                    }
                    canManage={canManageCourses}
                  />

                  {/* Acciones extra por curso */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openPickModal(c)}
                      className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                    >
                      Asignar constancia
                    </button>

                    {/* Mostrar plantilla asignada si existe */}
                    {c?.constancia?.plantilla?.nombre && (
                      <span className="text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {c.constancia.plantilla.nombre}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* REPORTES */
        <>
          {lr ? (
            <p>Cargando reportes…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {reports.map((r) => (
                <ReportListItem
                  key={r.id}
                  report={r}
                  onView={() => {
                    setDetailData(r);
                    setDetailType('report');
                    setShowDetail(true);
                  }}
                  onEdit={() => {
                    setEditReport(r);
                    setShowReportModal(true);
                  }}
                  onDelete={() => {
                    if (window.confirm('¿Eliminar reporte?')) {
                      handleDeleteReport(r);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* === MODALES === */}
      <CourseModal
        key={showCourseModal ? (editCourse?.encuesta?.id || editCourse?.id || 'new') : 'closed'}
        isOpen={showCourseModal}
        initialData={editCourse || {}}
        onClose={() => {
          setShowCourseModal(false);
          setEditCourse(null);
        }}
        onSubmit={async (data, img) => {
          const fails = validateCourse(data);
          if (fails.length) {
            toast.error(fails.join('\n'));
            return;
          }

          try {
            if (editCourse) {
              await updateCourse(editCourse.id, data, img);
            } else {
              await createCourse(data, img);
            }
            toast.success('Curso guardado');
            setShowCourseModal(false);
            setEditCourse(null);
          } catch (e) {
            console.error(e);
            toast.error('Error al guardar el curso');
          }
        }}
      />

      <ReportModal
        key={showReportModal ? (editReport?.id || 'new') : 'closed'}
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setEditReport(null);
        }}
        onSubmit={handleSaveReport}
        cursos={courses}
        initialData={editReport || {}}
      />

      <DetailsModal
        isOpen={showDetail}
        type={detailType}
        data={detailData}
        onClose={() => setShowDetail(false)}
        onDelete={detailType === 'report' ? () => handleDeleteReport(detailData) : undefined}
      />

      {/* Modal: Elegir constancia (Plantilla) */}
      {showPickConstancia && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">
                Asignar constancia al curso: <span className="text-indigo-700">{targetCourse?.titulo}</span>
              </h3>
              <button
                onClick={closePickModal}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>

            <div className="mb-4">
              <input
                placeholder="Buscar constancia por nombre…"
                value={pickSearch}
                onChange={(e) => setPickSearch(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {loadingPlantillas ? (
              <div className="text-center text-gray-500 py-8">Cargando constancias…</div>
            ) : filteredPlantillas.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No hay constancias cargadas.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[60vh] overflow-auto">
                {filteredPlantillas.map((p) => (
                  <div key={p.id} className="border rounded-lg p-3 hover:shadow transition flex flex-col">
                    <div className="text-sm font-medium truncate" title={p.nombre}>{p.nombre}</div>
                    <div className="text-xs text-gray-500 truncate mt-1">{p.storagePath}</div>

                    <div className="mt-3 flex gap-2">
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-xs"
                      >
                        Ver
                      </a>
                      <button
                        onClick={() => handleAssignPlantilla(p)}
                        className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                      >
                        Usar esta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ALERTAS GLOBALES */}
      <ToastContainer
        position="top-right"
        autoClose={3200}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}
