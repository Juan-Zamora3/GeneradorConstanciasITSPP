// src/paginas/Cursos.jsx
import React, { useState, useMemo, useContext, useEffect, useRef } from 'react';
import { saveAs } from 'file-saver';
import * as XLSX   from 'xlsx';
import { toast, ToastContainer } from 'react-toastify';   // 🆕
import 'react-toastify/dist/ReactToastify.css';           // 🆕
import { listToWorkbook, fileToList } from '../utilidades/excelHelpers';

import { useCourses } from '../utilidades/useCourses';
import { useReports } from '../utilidades/useReports';

import CourseListItem from '../componentes/PantallaCursos/CourseListItem';
import ReportListItem from '../componentes/PantallaCursos/ReportListItem';
import CourseModal    from '../componentes/PantallaCursos/CourseModal';
import ReportModal    from '../componentes/PantallaCursos/ReportModal';
import DetailsModal   from '../componentes/PantallaCursos/DetailsModal';
import { useSurveys } from '../utilidades/useSurveys';
import { QRCodeCanvas } from 'qrcode.react';


import { AuthContext } from '../contexto/AuthContext';

/* ---------------- VALIDADORES BÁSICOS ---------------- */
function validateCourse(c) {
  const errs = [];
  if (!c.titulo?.trim())        errs.push('Título obligatorio');
  if (!c.instructor?.trim())    errs.push('Instructor obligatorio');
  if (!c.fechaInicio?.trim())   errs.push('Fecha de inicio obligatoria');
  return errs;
}
function validateReport(r) {
  const errs = [];
  if (!r.titulo?.trim())        errs.push('Título obligatorio');
  if (!r.tipo?.trim())          errs.push('Tipo obligatorio');
  if (!r.cursoId?.trim())       errs.push('Curso asociado obligatorio');
  return errs;
}




/* -------------------------------------------------------------- */
export default function Cursos() {
  const { usuario } = useContext(AuthContext);
  const canManageCourses = usuario?.role !== 'user';

  /* ----------- data hooks ----------- */
  const { courses,  loading:lc, createCourse, updateCourse, deleteCourse } = useCourses();
  const { reports,  loading:lr, createReport, updateReport, deleteReport } = useReports();

  /* ----------- UI state ----------- */
  const [view, setView]        = useState('courses'); // courses | reports
  const [search, setSearch]    = useState('');
  const [sortBy, setSortBy]    = useState('titulo');
  const [filterCat, setFilterCat] = useState('');

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editCourse,      setEditCourse]      = useState(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [editReport,      setEditReport]      = useState(null);

  const [showDetail, setShowDetail] = useState(false);
  const [detailData, setDetailData] = useState({});
  const [detailType, setDetailType] = useState('course');

  const importRef = useRef(null);

  /* ----------- memo cursos filtrados ----------- */
  const filteredCourses = useMemo(() => {
    let arr = Array.isArray(courses) ? courses : [];
    if (search.trim()) {
      const t = search.toLowerCase();
      arr = arr.filter(c =>
        (c.titulo ?? '').toLowerCase().includes(t) ||
        (c.instructor ?? '').toLowerCase().includes(t)
      );
    }
    if (filterCat) arr = arr.filter(c => c.categoria === filterCat);
    return [...arr].sort((a,b)=>
      String(a[sortBy] ?? '').localeCompare(String(b[sortBy] ?? ''))
    );
  }, [courses, search, filterCat, sortBy]);

  /* =============== EXCEL: export / import =============== */
  const exportList = () => {
    const list = view === 'courses' ? courses : reports;
    const wb   = listToWorkbook(list);
    const wbout = XLSX.write(wb, { type:'array', bookType:'xlsx' });
    const today = new Date();
    const file = `${view === 'courses' ? 'Cursos' : 'Reportes'}-${today.toISOString().slice(0,10)}.xlsx`;
    saveAs(new Blob([wbout], {type:'application/octet-stream'}), file);
    toast.success('Excel exportado');             // 🆕 feedback
  };

  const handleImport = async e => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await fileToList(file);

      let nuevos=0, actualizados=0, errores=0;
      if (view === 'courses') {
        for (const r of rows) {
          const fails = validateCourse(r);
          if (fails.length) { errores++; continue; }

          const match = courses.find(c =>
            c.titulo === r.titulo && c.fechaInicio === r.fechaInicio);
          if (match) { await updateCourse(match.id, r, r.imagen); actualizados++; }
          else       { await createCourse(r, r.imagen);           nuevos++; }
        }
      } else {
        for (const r of rows) {
          const fails = validateReport(r);
          if (fails.length) { errores++; continue; }

          const match = reports.find(rep => rep.id === r.id);
          if (match) { await updateReport(match.id, r, r.imagenes); actualizados++; }
          else       { await createReport(r.cursoId, r, r.imagenes || []); nuevos++; }
        }
      }

      toast.success(`Importado • ${nuevos} nuevos • ${actualizados} actualizados${errores?` • ${errores} con error`:''}`);
      if (errores) toast.warn('Revisa filas con datos faltantes');
    } catch(err){
      console.error(err);
      toast.error('Error al importar');
    }
    e.target.value = '';
  };

  /* ----------- export automático día 1 ----------- */
  useEffect(() => {
    const listReady = view === 'courses' ? courses.length : reports.length;
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

  /* ----------- handlers ----------- */
  const handleSaveReport = async (data, imgs) => {
    const fails = validateReport(data);
    if (fails.length) { toast.error(fails.join('\n')); return; }

    try {
      if (editReport) await updateReport(editReport.id, data, imgs);
      else            await createReport(data.cursoId, data, imgs);
      toast.success('Reporte guardado');
      setShowReportModal(false);
      setEditReport(null);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el reporte');
    }
  };

  const handleDeleteReport = async rep => {
    if (!window.confirm('¿Eliminar reporte?')) return;
    await deleteReport(rep.id);
    toast.info('Reporte eliminado');
    setShowDetail(false);
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
            ref={importRef} type="file" accept=".xlsx,.xls"
            onChange={handleImport} className="hidden"
          />

          <button
            onClick={exportList}
            className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 flex items-center"
          >
            <i className="ri-download-2-line mr-1" /> Exportar Excel
          </button>

          {/* Nuevo Reporte */}
          <button
            onClick={() => { setEditReport(null); setShowReportModal(true); }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Nuevo Reporte
          </button>

          {/* Nuevo Curso */}
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
        /* CURSOS */
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
                  onView={()=>{ setDetailData(c); setDetailType('course'); setShowDetail(true); }}
                  onEdit={canManageCourses ? ()=>{ setEditCourse(c); setShowCourseModal(true);} : undefined}
                  onDelete={canManageCourses ? async ()=>{ if(window.confirm('¿Eliminar curso?')) { await deleteCourse(c.id); toast.info('Curso eliminado'); }} : undefined}
                  canManage={canManageCourses}
                />
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
              {reports.map(r=>(
                <ReportListItem key={r.id}
                  report={r}
                  onView={()=>{ setDetailData(r); setDetailType('report'); setShowDetail(true); }}
                  onEdit={()=>{ setEditReport(r); setShowReportModal(true);}}
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
          const fails = validateCourse(data);
          if (fails.length) { toast.error(fails.join('\n')); return; }

          try {
            if (editCourse) await updateCourse(editCourse.id, data, img);
            else            await createCourse(data, img);
            toast.success('Curso guardado');
            setShowCourseModal(false);
          } catch(e){ toast.error('Error al guardar el curso'); }
        }}
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={()=>{ setShowReportModal(false); setEditReport(null); }}
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
