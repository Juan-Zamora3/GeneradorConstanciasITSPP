import React, { useState, useMemo, useContext } from 'react';
import { useCourses } from '../utilidades/useCourses';
import { useReports } from '../utilidades/useReports';

import CourseListItem  from '../componentes/PantallaCursos/CourseListItem';
import ReportListItem  from '../componentes/PantallaCursos/ReportListItem';
import CourseModal     from '../componentes/PantallaCursos/CourseModal';
import ReportModal     from '../componentes/PantallaCursos/ReportModal';
import DetailsModal    from '../componentes/PantallaCursos/DetailsModal';

import { AuthContext } from '../contexto/AuthContext';

export default function Cursos() {
  /* ---------- autenticación ---------- */
  const { usuario } = useContext(AuthContext);
  const canManageCourses = usuario?.role !== 'user';

  /* ---------- hooks de datos ---------- */
  const {
    courses,
    loading: lc,
    createCourse,
    updateCourse,
    deleteCourse,
  } = useCourses();

  const {
    reports,
    loading: lr,
    createReport,
    updateReport,
    deleteReport,
  } = useReports();

  /* ---------- UI state ---------- */
  const [view, setView] = useState('courses');

  const [search, setSearch]     = useState('');
  const [sortBy, setSortBy]     = useState('titulo');
  const [filterCat, setFilterCat] = useState('');

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editCourse,      setEditCourse]      = useState(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [editReport,      setEditReport]      = useState(null);

  const [showDetail,  setShowDetail]  = useState(false);
  const [detailData,  setDetailData]  = useState({});
  const [detailType,  setDetailType]  = useState('course');

  /* ---------- memo cursos filtrados ---------- */
  const filteredCourses = useMemo(() => {
    let arr = Array.isArray(courses) ? courses : [];
    if (search.trim()) {
      const t = search.toLowerCase();
      arr = arr.filter(c =>
        (c.titulo     ?? '').toLowerCase().includes(t) ||
        (c.instructor ?? '').toLowerCase().includes(t)
      );
    }
    if (filterCat) arr = arr.filter(c => c.categoria === filterCat);
    return [...arr].sort((a,b)=>
      String(a[sortBy] ?? '').localeCompare(String(b[sortBy] ?? ''))
    );
  }, [courses, search, filterCat, sortBy]);

  /* ---------- handlers ---------- */
  const handleSaveReport = async (data, imgs) => {
    try {
      if (editReport) {
        await updateReport(editReport.id, data, imgs);
      } else {
        await createReport(data.cursoId, data, imgs);
      }
      setShowReportModal(false);
      setEditReport(null);
    } catch (err) {
      console.error(err);
      alert('Error al guardar el reporte');
    }
  };

  const handleDeleteReport = async rep => {
    if (!window.confirm('¿Eliminar reporte?')) return;
    await deleteReport(rep.id);
    setShowDetail(false);
  };

  /* ---------- render ---------- */
  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Gestión de Cursos</h2>

        <div className="flex gap-2">
          {/* Nuevo Reporte: disponible para todos */}
          <button
            onClick={() => { setEditReport(null); setShowReportModal(true); }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Nuevo Reporte
          </button>

          {/* Nuevo Curso: sólo roles no-user */}
          {canManageCourses && (
            <button
              onClick={() => { setEditCourse(null); setShowCourseModal(true); }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Nuevo Curso
            </button>
          )}
        </div>
      </div>

      {/* TOGGLE */}
      <div className="flex gap-2 mb-6">
        {['courses','reports'].map(key=>(
          <button key={key}
            onClick={()=>setView(key)}
            className={`px-4 py-2 rounded ${view===key?'bg-blue-600 text-white':'bg-gray-200'}`}>
            {key==='courses'?'Cursos':'Reportes'}
          </button>
        ))}
      </div>

      {/* === LISTAS === */}
      {view === 'courses' ? (
        /* ---------- CURSOS ---------- */
        <>
          {/* filtros */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              placeholder="Buscar cursos…"
              value={search}
              onChange={e=>setSearch(e.target.value)}
              className="flex-1 border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
              className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="titulo">Ordenar por título</option>
              <option value="fechaInicio">Ordenar por fecha</option>
            </select>
            <select value={filterCat} onChange={e=>setFilterCat(e.target.value)}
              className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todas las categorías</option>
              <option value="informatica">Informática</option>
              <option value="administracion">Administración</option>
            </select>
          </div>

          {lc ? (
            <p>Cargando cursos…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredCourses.map(c=>(
                <CourseListItem key={c.id}
                  course={c}
                  onView={()=>{
                    setDetailData(c);
                    setDetailType('course');
                    setShowDetail(true);
                  }}
                  onEdit={canManageCourses ? ()=>{
                    setEditCourse(c);
                    setShowCourseModal(true);
                  } : undefined}
                  onDelete={canManageCourses ? async ()=>{
                    if (window.confirm('¿Eliminar curso?')) await deleteCourse(c.id);
                  } : undefined}
                  canManage={canManageCourses}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        /* ---------- REPORTES ---------- */
        <>
          {lr ? (
            <p>Cargando reportes…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {reports.map(r=>(
                <ReportListItem
                  key={r.id}
                  report={r}
                  onView={()=>{
                    setDetailData(r);
                    setDetailType('report');
                    setShowDetail(true);
                  }}
                  onEdit={()=>{
                    setEditReport(r);
                    setShowReportModal(true);
                  }}
                  onDelete={()=>handleDeleteReport(r)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* === MODALES === */}
      <CourseModal
        isOpen={showCourseModal}
        initialData={editCourse||{}}
        onClose={()=>setShowCourseModal(false)}
        onSubmit={async (data,img)=>{
          if (editCourse) await updateCourse(editCourse.id, data, img);
          else            await createCourse(data, img);
          setShowCourseModal(false);
        }}
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={()=>{
          setShowReportModal(false);
          setEditReport(null);
        }}
        onSubmit={handleSaveReport}
        cursos={courses}
        initialData={editReport||{}}
      />

      <DetailsModal
        isOpen={showDetail}
        type={detailType}
        data={detailData}
        onClose={()=>setShowDetail(false)}
        onDelete={detailType==='report'
          ? ()=>handleDeleteReport(detailData)
          : undefined}
      />
    </div>
  );
}
