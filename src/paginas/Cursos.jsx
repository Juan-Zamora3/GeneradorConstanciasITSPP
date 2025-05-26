import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { AuthContext } from '../contexto/AuthContext';
import { db, storage } from '../servicios/firebaseConfig';

export default function Cursos() {
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);

  // Estados originales mantenidos
  const [cursos, setCursos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('titulo');
  const [showModal, setShowModal] = useState(false);
  const [showDetalles, setShowDetalles] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);

  // Nuevos estados para funcionalidades avanzadas
  const [filterByCategory, setFilterByCategory] = useState('');
  const [showReportesModal, setShowReportesModal] = useState(false);
  const [showNewReportModal, setShowNewReportModal] = useState(false);
  const [showReportDetailsModal, setShowReportDetailsModal] = useState(false);
  const [showEditReportModal, setShowEditReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportes, setReportes] = useState([]);
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  const [reportFilterByType, setReportFilterByType] = useState('');

  // Estados para nuevo reporte
  const [nuevoReporte, setNuevoReporte] = useState({
    titulo: '',
    descripcion: '',
    tipo: '',
    fecha: new Date().toISOString().substr(0, 10),
    cursoId: ''
  });

  // Estados para editar
  const [editandoCurso, setEditandoCurso] = useState({
    titulo: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    instructor: '',
    ubicacion: '',
    lista: '',
    categoria: 'informatica'
  });

  const [editandoReporte, setEditandoReporte] = useState({
    titulo: '',
    descripcion: '',
    tipo: '',
    fecha: ''
  });

  // Estados para manejo de imágenes
  const [imagenes, setImagenes] = useState([]);
  const [previewImagenes, setPreviewImagenes] = useState([]);

  /* ---------- Leer colección "Cursos" en tiempo real (ORIGINAL MANTENIDO) ---------- */
/* ---------- Leer colección "Cursos" en tiempo real (ORIGINAL MANTENIDO) ---------- */
useEffect(() => {
  if (!usuario) {
    navigate('/login', { replace: true });
    return;
  }

  const q = query(
    collection(db, 'Cursos'),
    orderBy('fechaInicio', 'asc')
  );

  const unsub = onSnapshot(
    q,
    snap => {
      const data = snap.docs.map(doc => {
        const d = doc.data();

        return {
          id: doc.id,
          titulo: d.cursoNombre || 'Sin título',
          instructor: d.asesor || 'Sin instructor',
          fechaInicio: d.fechaInicio || '',
          fechaFin: d.fechaFin || '',
          categoria: d.categoria || 'sin_categoria',
          estado: d.estado || 'proximo',
          participantes: d.asistencia?.[0]?.estudiantes || [],
          lista: (d.listas && d.listas[0]) || '',
          descripcion: d.descripcion || '',
          ubicacion: d.ubicacion || '',
          reportes: d.reportes || []
        };
      });
      setCursos(data);
      
      // Extraer todos los reportes para vista global
      const todosReportes = data.flatMap(c =>
        (c.reportes || []).map(r => ({
          ...r,
          cursoId: c.id,
          cursoNombre: c.titulo
        }))
      );
      setReportes(todosReportes);
    },
    err => {
      console.error('Error al obtener cursos:', err);
      alert(`Error al cargar cursos: ${err.message}`);
    }
  );

  return () => unsub();
}, [usuario, navigate]);
const [mostrarParticipantes, setMostrarParticipantes] = useState(false);
const [showParticipantesModal, setShowParticipantesModal] = useState(false);
const mostrarParticipantesModal = () => setShowParticipantesModal(true);



// ✅ AÑADIR ESTE useEffect AQUÍ:
useEffect(() => {
  // Actualizar cursoSeleccionado cuando cambie la lista de cursos
  if (cursoSeleccionado) {
    const cursoActualizado = cursos.find(c => c.id === cursoSeleccionado.id);
    if (cursoActualizado) {
      setCursoSeleccionado(cursoActualizado);
    }
  }
}, [cursos, cursoSeleccionado?.id]); // Depende de cursos y del ID del curso seleccionado

  /* ---------- Utilidades de búsqueda y orden ---------- */
  const filtrarCursos = () => {
    let filtered = cursos;
    
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.categoria || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterByCategory) {
      filtered = filtered.filter(c => c.categoria === filterByCategory);
    }
    
    return filtered;
  };

  const ordenarCursos = arr => {
    return [...arr].sort((a, b) => {
      if (sortBy === 'titulo') return a.titulo.localeCompare(b.titulo);
      if (sortBy === 'fechaInicio')
        return new Date(a.fechaInicio) - new Date(b.fechaInicio);
      if (sortBy === 'categoria') return a.categoria.localeCompare(b.categoria);
      return 0;
    });
  };

  /* ---------- CRUD Cursos ---------- */
  const [nuevoCurso, setNuevoCurso] = useState({
    titulo: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    instructor: '',
    ubicacion: '',
    lista: '',
    categoria: 'informatica'
  });

  const handleInputChange = e => {
    const { name, value } = e.target;
    setNuevoCurso(nc => ({ ...nc, [name]: value }));
  };

  const handleEditInputChange = e => {
    const { name, value } = e.target;
    setEditandoCurso(ec => ({ ...ec, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'Cursos'), {
        cursoNombre: nuevoCurso.titulo,
        descripcion: nuevoCurso.descripcion,
        fechaInicio: nuevoCurso.fechaInicio,
        fechaFin: nuevoCurso.fechaFin,
        asesor: nuevoCurso.instructor,
        ubicacion: nuevoCurso.ubicacion,
        listas: nuevoCurso.lista ? [nuevoCurso.lista] : [],
        categoria: nuevoCurso.categoria,
        estado: 'proximo',
        asistencia: [],
        reportes: []
      });
      setShowModal(false);
      setNuevoCurso({
        titulo: '',
        descripcion: '',
        fechaInicio: '',
        fechaFin: '',
        instructor: '',
        ubicacion: '',
        lista: '',
        categoria: 'informatica'
      });
      alert('Curso creado correctamente');
    } catch (err) {
      console.error('Error al guardar curso:', err);
      alert(`Error al guardar curso: ${err.message}`);
    }
  };

  const handleEditarCurso = async e => {
    e.preventDefault();
    if (!cursoSeleccionado) return;

    try {
      const cursoRef = doc(db, 'Cursos', cursoSeleccionado.id);
      await updateDoc(cursoRef, {
        cursoNombre: editandoCurso.titulo,
        descripcion: editandoCurso.descripcion,
        fechaInicio: editandoCurso.fechaInicio,
        fechaFin: editandoCurso.fechaFin,
        asesor: editandoCurso.instructor,
        ubicacion: editandoCurso.ubicacion,
        listas: editandoCurso.lista ? [editandoCurso.lista] : [],
        categoria: editandoCurso.categoria
      });
      setShowEditModal(false);
      setCursoSeleccionado(null);
      alert('Curso actualizado correctamente');
    } catch (err) {
      console.error('Error al actualizar curso:', err);
      alert(`Error al actualizar curso: ${err.message}`);
    }
  };

  /* ---------- CRUD Reportes ---------- */
  
  // Manejo de imágenes
  const handleImagenChange = e => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setImagenes(prev => [...prev, ...files]);
    setPreviewImagenes(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const eliminarImagen = idx => {
    setImagenes(arr => arr.filter((_, i) => i !== idx));
    setPreviewImagenes(prev => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const subirImagenesYObtenerUrls = async () => {
    const urls = [];
    for (const file of imagenes) {
      const fileRef = ref(
        storage,
        `reportes/${Date.now()}-${crypto.randomUUID()}-${file.name}`
      );
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      urls.push(url);
    }
    return urls;
  };

  const handleReportInputChange = e => {
    const { name, value } = e.target;
    setNuevoReporte(prev => ({ ...prev, [name]: value }));
  };

  const handleEditReportInputChange = e => {
    const { name, value } = e.target;
    setEditandoReporte(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateReport = async e => {
    e.preventDefault();
    if (!nuevoReporte.cursoId) return alert('Selecciona un curso');

    try {
      const urls = await subirImagenesYObtenerUrls();

      const newReport = {
        id: crypto.randomUUID(),
        titulo: nuevoReporte.titulo,
        descripcion: nuevoReporte.descripcion,
        tipo: nuevoReporte.tipo,
        fecha: nuevoReporte.fecha,
        imagenes: urls,
        creadoPor: usuario.nombre || usuario.email || 'Anónimo',
        fechaCreacion: new Date().toISOString()
      };

      const cursoRef = doc(db, 'Cursos', nuevoReporte.cursoId);
      await updateDoc(cursoRef, {
        reportes: arrayUnion(newReport)
      });

      setNuevoReporte({
        titulo: '',
        descripcion: '',
        tipo: '',
        fecha: new Date().toISOString().substr(0, 10),
        cursoId: ''
      });
      setImagenes([]);
      setPreviewImagenes([]);
      setShowNewReportModal(false);
      alert('Reporte creado correctamente');
    } catch (err) {
      console.error('Error al guardar reporte:', err);
      alert(`Error al guardar reporte: ${err.message}`);
    }
  };

  const handleEditarReporte = async e => {
    e.preventDefault();
    if (!selectedReport || !cursoSeleccionado) return;

    try {
      const urls = imagenes.length > 0 ? await subirImagenesYObtenerUrls() : selectedReport.imagenes;

      const updatedReport = {
        ...selectedReport,
        titulo: editandoReporte.titulo,
        descripcion: editandoReporte.descripcion,
        tipo: editandoReporte.tipo,
        fecha: editandoReporte.fecha,
        imagenes: urls
      };

      const cursoRef = doc(db, 'Cursos', cursoSeleccionado.id);
      
      // Remover el reporte anterior
      await updateDoc(cursoRef, {
        reportes: arrayRemove(selectedReport)
      });
      
      // Añadir el reporte actualizado
      await updateDoc(cursoRef, {
        reportes: arrayUnion(updatedReport)
      });

      setShowEditReportModal(false);
      setSelectedReport(null);
      setImagenes([]);
      setPreviewImagenes([]);
      alert('Reporte actualizado correctamente');
    } catch (err) {
      console.error('Error al actualizar reporte:', err);
      alert(`Error al actualizar reporte: ${err.message}`);
    }
  };

  const handleEliminarReporte = async (reporte, cursoId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este reporte?')) return;

    try {
      const cursoRef = doc(db, 'Cursos', cursoId);
      await updateDoc(cursoRef, {
        reportes: arrayRemove(reporte)
      });
      alert('Reporte eliminado correctamente');
    } catch (err) {
      console.error('Error al eliminar reporte:', err);
      alert(`Error al eliminar reporte: ${err.message}`);
    }
  };

  // Filtrar reportes
  const filtrarReportes = () => {
    let filtered = cursoSeleccionado ? 
      reportes.filter(r => r.cursoId === cursoSeleccionado.id) : 
      reportes;
    
    if (reportSearchTerm) {
      filtered = filtered.filter(r =>
        r.titulo.toLowerCase().includes(reportSearchTerm.toLowerCase()) ||
        r.tipo.toLowerCase().includes(reportSearchTerm.toLowerCase())
      );
    }
    
    if (reportFilterByType) {
      filtered = filtered.filter(r => r.tipo === reportFilterByType);
    }
    
    return filtered;
  };

  /* ---------- Funciones de Modal ---------- */
  const mostrarDetalles = curso => {
    setCursoSeleccionado(curso);
    setShowDetalles(true);
  };

  const mostrarEditarCurso = curso => {
    setCursoSeleccionado(curso);
    setEditandoCurso({
      titulo: curso.titulo,
      descripcion: curso.descripcion,
      fechaInicio: curso.fechaInicio,
      fechaFin: curso.fechaFin,
      instructor: curso.instructor,
      ubicacion: curso.ubicacion,
      lista: curso.lista,
      categoria: curso.categoria
    });
    setShowEditModal(true);
  };

  const mostrarReportes = curso => {
    setCursoSeleccionado(curso);
    setShowReportesModal(true);
  };

  const mostrarDetallesReporte = reporte => {
    setSelectedReport(reporte);
    setShowReportDetailsModal(true);
  };

  const mostrarEditarReporte = reporte => {
    setSelectedReport(reporte);
    setEditandoReporte({
      titulo: reporte.titulo,
      descripcion: reporte.descripcion,
      tipo: reporte.tipo,
      fecha: reporte.fecha
    });
    setShowEditReportModal(true);
  };

  const mostrarNuevoReporteParaCurso = curso => {
    setNuevoReporte(prev => ({ ...prev, cursoId: curso.id }));
    setShowNewReportModal(true);
  };

  /* ---------- Funciones de formato (ORIGINALES) ---------- */
  const formatearFechas = (fechaInicio, fechaFin) => {
    try {
      const inicio = fechaInicio
        ? new Date(fechaInicio).toLocaleDateString('es-MX')
        : 'Sin fecha';
      const fin = fechaFin
        ? new Date(fechaFin).toLocaleDateString('es-MX')
        : 'Sin fecha';
      return `${inicio} - ${fin}`;
    } catch {
      return 'Fechas no válidas';
    }
  };

  const formatearCategoria = categoria => {
    const categorias = {
      informatica: 'Informática',
      administracion: 'Administración',
      ingles: 'Inglés',
      marketing: 'Marketing',
      recursos_humanos: 'Recursos Humanos',
      desarrollo_personal: 'Desarrollo Personal',
      sin_categoria: 'Sin categoría'
    };
    return categorias[categoria] || categoria;
  };

  const formatearEstado = estado => {
    const estados = {
      proximo: 'Próximo',
      en_curso: 'En Curso',
      completado: 'Completado',
      cancelado: 'Cancelado'
    };
    return estados[estado] || estado;
  };

  const formatearTipoReporte = tipo => {
    const tipos = {
      asistencia: 'Asistencia',
      incidente: 'Incidente',
      evaluacion: 'Evaluación',
      general: 'General'
    };
    return tipos[tipo] || tipo;
  };

  const getColorCategoria = categoria => {
    const colores = {
      informatica: 'bg-blue-500',
      administracion: 'bg-green-500',
      ingles: 'bg-purple-500',
      marketing: 'bg-orange-500',
      recursos_humanos: 'bg-pink-500',
      desarrollo_personal: 'bg-indigo-500',
      sin_categoria: 'bg-gray-500'
    };
    return colores[categoria] || 'bg-gray-500';
  };

  const getColorEstado = estado => {
    const colores = {
      proximo: 'bg-blue-100 text-blue-800',
      en_curso: 'bg-green-100 text-green-800',
      completado: 'bg-purple-100 text-purple-800',
      cancelado: 'bg-red-100 text-red-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const getColorTipoReporte = tipo => {
    const colores = {
      asistencia: 'bg-green-100 text-green-800',
      incidente: 'bg-red-100 text-red-800',
      evaluacion: 'bg-blue-100 text-blue-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colores[tipo] || 'bg-gray-100 text-gray-800';
  };

  /* ------------------------------ RENDER ----------------------------- */
  if (!usuario) return null;
  const cursosOrdenados = ordenarCursos(filtrarCursos());
  const reportesFiltrados = filtrarReportes();

  return (
    <div className="p-6 space-y-6">
      {/* Título y botones */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold">Gestión de Cursos</h2>
        <div className="flex gap-2 mt-4 md:mt-0">
          <button
            onClick={() => setShowNewReportModal(true)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          >
            <i className="ri-file-add-line mr-2" />
            Nuevo Reporte
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            <i className="ri-add-line mr-2" />
            Nuevo Curso
          </button>
        </div>
      </div>

      {/* Búsqueda + orden + filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar cursos…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <i className="ri-search-line absolute left-3 top-3 text-gray-400" />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="titulo">Ordenar por título</option>
            <option value="fechaInicio">Ordenar por fecha de inicio</option>
            <option value="categoria">Ordenar por categoría</option>
          </select>
        </div>
        <div className="w-full sm:w-48">
          <select
            value={filterByCategory}
            onChange={e => setFilterByCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas las categorías</option>
            <option value="informatica">Informática</option>
            <option value="administracion">Administración</option>
            <option value="ingles">Inglés</option>
            <option value="marketing">Marketing</option>
            <option value="recursos_humanos">Recursos Humanos</option>
            <option value="desarrollo_personal">Desarrollo Personal</option>
          </select>
        </div>
      </div>

      {/* Grid de cursos */}
      {cursosOrdenados.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-gray-100">
            <i className="ri-folder-open-line text-4xl text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No hay cursos</h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchTerm
              ? `No se encontraron cursos para "${searchTerm}"`
              : 'Aún no hay cursos creados. Agrega tu primer curso.'}
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              <i className="ri-add-line mr-2" />
              Agregar Curso
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cursosOrdenados.map(curso => (
            <div
              key={curso.id}
              className="bg-white rounded-xl shadow overflow-hidden flex flex-col h-full"
            >
              <div className={`h-2 ${getColorCategoria(curso.categoria)}`} />
              <div className="p-6 flex-grow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg text-gray-800 line-clamp-2">
                    {curso.titulo}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getColorEstado(
                        curso.estado
                      )}`}
                    >
                      {formatearEstado(curso.estado)}
                    </span>
                    
                    {/* Menú desplegable SOLO para crear reportes */}
                    <div className="relative group">
                      <button className="p-1 text-gray-800 hover:text-gray-600 rounded">
                        <i className="ri-more-2-fill text-lg" />
                      </button>
                      <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                        <button
                          onClick={() => mostrarNuevoReporteParaCurso(curso)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center"
                        >
                          <i className="ri-file-add-line mr-2 text-gray-400" />
                          Crear nuevo reporte
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-2 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <i className="ri-calendar-line mr-2 text-gray-400" />
                    <span>{formatearFechas(curso.fechaInicio, curso.fechaFin)}</span>
                  </div>
                  <div className="flex items-center">
                    <i className="ri-user-line mr-2 text-gray-400" />
                    <span>{curso.instructor}</span>
                  </div>
                  <div className="flex items-center">
                    <i className="ri-folder-line mr-2 text-gray-400" />
                    <span>{formatearCategoria(curso.categoria)}</span>
                  </div>
                  <div className="flex items-center">
                    <i className="ri-group-line mr-2 text-gray-400" />
                    <span>{curso.participantes?.length || 0} participantes</span>
                  </div>
                  <div className="flex items-center">
                    <i className="ri-file-text-line mr-2 text-gray-400" />
                    <span>{curso.reportes?.length || 0} reportes</span>
                  </div>
                </div>
              </div>
              
              {/* Botones grandes abajo (ORIGINAL) */}
              <div className="border-t p-4 flex gap-2">
                <button
                  onClick={() => mostrarDetalles(curso)}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition flex items-center justify-center"
                >
                  <i className="ri-eye-line mr-1" /> Ver
                </button>
                <button
                  onClick={() => mostrarEditarCurso(curso)}
                  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center justify-center"
                >
                  <i className="ri-edit-line mr-1" /> Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------- Modal NUEVO CURSO ------------------- */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Crear Nuevo Curso</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-2xl" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título del curso *
                    </label>
                    <input
                      type="text"
                      name="titulo"
                      value={nuevoCurso.titulo}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Desarrollo Web Full Stack"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instructor *
                    </label>
                    <input
                      type="text"
                      name="instructor"
                      value={nuevoCurso.instructor}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nombre del instructor"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de inicio *
                    </label>
                    <input
                      type="date"
                      name="fechaInicio"
                      value={nuevoCurso.fechaInicio}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de fin *
                    </label>
                    <input
                      type="date"
                      name="fechaFin"
                      value={nuevoCurso.fechaFin}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ubicación
                    </label>
                    <input
                      type="text"
                      name="ubicacion"
                      value={nuevoCurso.ubicacion}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Aula 101, Virtual, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría *
                    </label>
                    <select
                      name="categoria"
                      value={nuevoCurso.categoria}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="informatica">Informática</option>
                      <option value="administracion">Administración</option>
                      <option value="ingles">Inglés</option>
                      <option value="marketing">Marketing</option>
                      <option value="recursos_humanos">Recursos Humanos</option>
                      <option value="desarrollo_personal">Desarrollo Personal</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    value={nuevoCurso.descripcion}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descripción del curso..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lista de participantes (opcional)
                  </label>
                  <input
                    type="text"
                    name="lista"
                    value={nuevoCurso.lista}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="URL o referencia a lista de participantes"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  >
                    <i className="ri-save-line mr-2" />
                    Guardar curso
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- Modal VER DETALLES CURSO ------------------- */}
      {showDetalles && cursoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Detalles del Curso</h3>
                <button
                  onClick={() => setShowDetalles(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-2xl" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                    <p className="text-gray-900 font-medium">{cursoSeleccionado.titulo}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
                    <p className="text-gray-900">{cursoSeleccionado.instructor}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fechas</label>
                    <p className="text-gray-900">{formatearFechas(cursoSeleccionado.fechaInicio, cursoSeleccionado.fechaFin)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                    <p className="text-gray-900">{cursoSeleccionado.ubicacion || 'No especificada'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium text-white ${getColorCategoria(cursoSeleccionado.categoria)}`}>
                      {formatearCategoria(cursoSeleccionado.categoria)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getColorEstado(cursoSeleccionado.estado)}`}>
                      {formatearEstado(cursoSeleccionado.estado)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Participantes</label>
                    <p className="text-gray-900">{cursoSeleccionado.participantes?.length || 0} inscritos</p>
                    <button
  onClick={mostrarParticipantesModal}
  className="text-sm text-blue-600 hover:text-blue-800 mt-1"
>
  Ver lista de participantes
</button>
{showParticipantesModal && cursoSeleccionado && (
  <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto shadow-lg">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Participantes</h3>
          <button
            onClick={() => setShowParticipantesModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <i className="ri-close-line text-2xl" />
          </button>
        </div>

        {cursoSeleccionado.participantes?.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">#</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Nombre completo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cursoSeleccionado.participantes.map((p, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 text-gray-600">{i + 1}</td>
                  <td className="px-4 py-2 text-gray-800">
                    {p.Nombres} {p.ApellidoP} {p.ApellidoM}
                  </td>
                </tr>
                
              ))}
            </tbody>
            <div className="flex justify-end pt-4">
  <button
    onClick={() => setShowParticipantesModal(false)}
    className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition"
  >
    Regresar
  </button>
</div>
          </table>

        ) : (
          <p className="text-gray-600">No hay participantes registrados.</p>
        )}
      </div>
    </div>
  </div>
)}

                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total de reportes</label>
                    <p className="text-gray-900">{cursoSeleccionado.reportes?.length || 0} reportes</p>
                  </div>
                </div>
              </div>

              {cursoSeleccionado.descripcion && (
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                  <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{cursoSeleccionado.descripcion}</p>
                </div>
              )}

              {/* Sección de Reportes - CORREGIDA */}
<div className="border-t pt-6">
  <div className="flex justify-between items-center mb-4">
    <h4 className="text-lg font-semibold">Reportes del Curso</h4>
    <button
      onClick={() => mostrarNuevoReporteParaCurso(cursoSeleccionado)}
      className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition"
    >
      <i className="ri-add-line mr-1" />
      Nuevo Reporte
    </button>
  </div>

  {cursoSeleccionado.reportes && cursoSeleccionado.reportes.length > 0 ? (
    <div className="space-y-3">
      {cursoSeleccionado.reportes.map((reporte, index) => (
        <div key={reporte.id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h5 className="font-medium text-gray-900">{reporte.titulo}</h5>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getColorTipoReporte(reporte.tipo)}`}>
                  {formatearTipoReporte(reporte.tipo)}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-2">{reporte.descripcion}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>
                  <i className="ri-calendar-line mr-1" />
                  {new Date(reporte.fecha).toLocaleDateString('es-MX')}
                </span>
                <span>
                  <i className="ri-user-line mr-1" />
                  {reporte.creadoPor}
                </span>
                {reporte.imagenes && reporte.imagenes.length > 0 && (
                  <span>
                    <i className="ri-image-line mr-1" />
                    {reporte.imagenes.length} imagen{reporte.imagenes.length !== 1 ? 'es' : ''}
                  </span>
                )}
              </div>
            </div>
            
            {/* Botones de acción a la derecha */}
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => mostrarDetallesReporte(reporte)}
                className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition flex items-center"
              >
                <i className="ri-eye-line mr-1" />
                Ver informe
              </button>
              <button
                onClick={() => mostrarEditarReporte(reporte)}
                className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition flex items-center"
              >
                <i className="ri-edit-line mr-1" />
                Editar informe
              </button>
              <button
                onClick={() => handleEliminarReporte(reporte, cursoSeleccionado.id)}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition flex items-center"
              >
                <i className="ri-delete-bin-line mr-1" />
                Borrar informe
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="text-center py-8 text-gray-500">
      <i className="ri-file-list-line text-3xl mb-2 block" />
      <p>No hay reportes para este curso</p>
      <button
        onClick={() => mostrarNuevoReporteParaCurso(cursoSeleccionado)}
        className="mt-2 text-blue-500 hover:text-blue-700 text-sm"
      >
        Crear el primer reporte
      </button>
    </div>
  )}
</div>

              <div className="flex justify-end pt-6 border-t">
                <button
                  onClick={() => setShowDetalles(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- Modal EDITAR CURSO ------------------- */}
      {showEditModal && cursoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Editar Curso</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-2xl" />
                </button>
              </div>

              <form onSubmit={handleEditarCurso} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título del curso *
                    </label>
                    <input
                      type="text"
                      name="titulo"
                      value={editandoCurso.titulo}
                      onChange={handleEditInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instructor *
                    </label>
                    <input
                      type="text"
                      name="instructor"
                      value={editandoCurso.instructor}
                      onChange={handleEditInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de inicio *
                    </label>
                    <input
                      type="date"
                      name="fechaInicio"
                      value={editandoCurso.fechaInicio}
                      onChange={handleEditInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de fin *
                    </label>
                    <input
                      type="date"
                      name="fechaFin"
                      value={editandoCurso.fechaFin}
                      onChange={handleEditInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ubicación
                    </label>
                    <input
                      type="text"
                      name="ubicacion"
                      value={editandoCurso.ubicacion}
                      onChange={handleEditInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría *
                    </label>
                    <select
                      name="categoria"
                      value={editandoCurso.categoria}
                      onChange={handleEditInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="informatica">Informática</option>
                      <option value="administracion">Administración</option>
                      <option value="ingles">Inglés</option>
                      <option value="marketing">Marketing</option>
                      <option value="recursos_humanos">Recursos Humanos</option>
                      <option value="desarrollo_personal">Desarrollo Personal</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    value={editandoCurso.descripcion}
                    onChange={handleEditInputChange}
                    rows="3"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lista de participantes (opcional)
                  </label>
                  <input
                    type="text"
                    name="lista"
                    value={editandoCurso.lista}
                    onChange={handleEditInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  >
                    <i className="ri-save-line mr-2" />
                    Actualizar curso
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- Modal NUEVO REPORTE ------------------- */}
      {showNewReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Crear Nuevo Reporte</h3>
                <button
                  onClick={() => setShowNewReportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-2xl" />
                </button>
              </div>

              <form onSubmit={handleCreateReport} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Curso *
                    </label>
                    <select
                      name="cursoId"
                      value={nuevoReporte.cursoId}
                      onChange={handleReportInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccionar curso</option>
                      {cursos.map(curso => (
                        <option key={curso.id} value={curso.id}>
                          {curso.titulo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de reporte *
                    </label>
                    <select
                      name="tipo"
                      value={nuevoReporte.tipo}
                      onChange={handleReportInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccionar tipo</option>
                      <option value="asistencia">Asistencia</option>
                      <option value="incidente">Incidente</option>
                      <option value="evaluacion">Evaluación</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título del reporte *
                    </label>
                    <input
                      type="text"
                      name="titulo"
                      value={nuevoReporte.titulo}
                      onChange={handleReportInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Reporte de asistencia semana 1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      name="fecha"
                      value={nuevoReporte.fecha}
                      onChange={handleReportInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción *
                  </label>
                  <textarea
                    name="descripcion"
                    value={nuevoReporte.descripcion}
                    onChange={handleReportInputChange}
                    required
                    rows="3"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descripción detallada del reporte..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imágenes (opcional)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImagenChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {previewImagenes.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {previewImagenes.map((preview, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => eliminarImagen(idx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            <i className="ri-close-line" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewReportModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                  >
                    <i className="ri-save-line mr-2" />
                    Guardar reporte
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- Modal VER DETALLES REPORTE ------------------- */}
      {showReportDetailsModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-lg max-w-3xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Detalles del Reporte</h3>
                <button
                  onClick={() => setShowReportDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-2xl" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                    <p className="text-gray-900 font-medium">{selectedReport.titulo}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getColorTipoReporte(selectedReport.tipo)}`}>
                      {formatearTipoReporte(selectedReport.tipo)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                    <p className="text-gray-900">{new Date(selectedReport.fecha).toLocaleDateString('es-MX')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Creado por</label>
                    <p className="text-gray-900">{selectedReport.creadoPor}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                  <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{selectedReport.descripcion}</p>
                </div>

                {selectedReport.imagenes && selectedReport.imagenes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Imágenes adjuntas</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedReport.imagenes.map((imagen, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={imagen}
                            alt={`Imagen ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <button
                            onClick={() => window.open(imagen, '_blank')}
                            className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center"
                          >
                            <i className="ri-eye-line text-white text-2xl opacity-0 hover:opacity-100 transition-opacity" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  onClick={() => setShowReportDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setShowReportDetailsModal(false);
                    mostrarEditarReporte(selectedReport);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  <i className="ri-edit-line mr-2" />
                  Editar reporte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- Modal EDITAR REPORTE ------------------- */}
      {showEditReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Editar Reporte</h3>
                <button
                  onClick={() => setShowEditReportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-2xl" />
                </button>
              </div>

              <form onSubmit={handleEditarReporte} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de reporte *
                    </label>
                    <select
                      name="tipo"
                      value={editandoReporte.tipo}
                      onChange={handleEditReportInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="asistencia">Asistencia</option>
                      <option value="incidente">Incidente</option>
                      <option value="evaluacion">Evaluación</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      name="fecha"
                      value={editandoReporte.fecha}
                      onChange={handleEditReportInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título del reporte *
                  </label>
                  <input
                    type="text"
                    name="titulo"
                    value={editandoReporte.titulo}
                    onChange={handleEditReportInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción *
                  </label>
                  <textarea
                    name="descripcion"
                    value={editandoReporte.descripcion}
                    onChange={handleEditReportInputChange}
                    required
                    rows="3"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nuevas imágenes (opcional)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImagenChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {previewImagenes.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {previewImagenes.map((preview, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => eliminarImagen(idx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            <i className="ri-close-line" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedReport.imagenes && selectedReport.imagenes.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Imágenes actuales:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedReport.imagenes.map((imagen, idx) => (
                          <img
                            key={idx}
                            src={imagen}
                            alt={`Actual ${idx + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditReportModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  >
                    <i className="ri-save-line mr-2" />
                    Actualizar reporte
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}