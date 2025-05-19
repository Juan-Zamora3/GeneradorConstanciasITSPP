// Reportes.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  orderBy
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import { db, storage } from '../servicios/firebaseConfig';
import { AuthContext } from '../contexto/AuthContext';

export default function Reportes() {
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);

  /* -------------------------- estado -------------------------- */
  const [busqueda, setBusqueda] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('fecha');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [reportes, setReportes] = useState([]);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  const [verDetalle, setVerDetalle] = useState(false);

  const [cursos, setCursos] = useState([]);

  const [imagenes, setImagenes] = useState([]);
  const [previewImagenes, setPreviewImagenes] = useState([]);

  const [nuevoReporte, setNuevoReporte] = useState({
    titulo: '',
    descripcion: '',
    tipo: '',
    fecha: new Date().toISOString().substr(0, 10),
    cursoId: ''
  });

  /* --------------------- cargar cursos + reportes -------------------- */
  useEffect(() => {
    if (!usuario) {
      navigate('/login', { replace: true });
      return;
    }

    const q = query(collection(db, 'Cursos'), orderBy('fechaInicio', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const cursosData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCursos(cursosData);

      const todosReportes = cursosData.flatMap(c =>
        (c.reportes || []).map(r => ({
          ...r,
          id: crypto.randomUUID(),          // id local para React
          cursoId: c.id,
          cursoNombre: c.cursoNombre || c.titulo || 'Sin título'
        }))
      );
      setReportes(todosReportes);
    });

    return () => unsub();
  }, [usuario, navigate]);

  /* ------------------------- imágenes ------------------------- */
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

  /* ----------------------- formulario ------------------------- */
  const handleInputChange = e => {
    const { name, value } = e.target;
    setNuevoReporte(nr => ({ ...nr, [name]: value }));
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

  const handleSubmit = async e => {
    e.preventDefault();
    if (!nuevoReporte.cursoId) return alert('Selecciona un curso');

    try {
      const urls = await subirImagenesYObtenerUrls();

      const cursoRef = doc(db, 'Cursos', nuevoReporte.cursoId);
      await updateDoc(cursoRef, {
        reportes: arrayUnion({
          titulo: nuevoReporte.titulo,
          descripcion: nuevoReporte.descripcion,
          tipo: nuevoReporte.tipo,
          fecha: nuevoReporte.fecha,
          imagenes: urls,
          creadoPor: usuario.nombre || usuario.email || 'Anónimo',
          fechaCreacion: new Date().toISOString()
        })
      });

      // limpiar UI
      setNuevoReporte({
        titulo: '',
        descripcion: '',
        tipo: '',
        fecha: new Date().toISOString().substr(0, 10),
        cursoId: ''
      });
      imagenes.forEach(f => URL.revokeObjectURL(f));
      setImagenes([]);
      setPreviewImagenes([]);
      setMostrarFormulario(false);
    } catch (err) {
      console.error('Error al guardar reporte:', err);
      alert(`Error al guardar reporte: ${err.message}`);
    }
  };

  /* ---------------------- utilidades UI ----------------------- */
  const filtrarReportes = () =>
    !busqueda
      ? reportes
      : reportes.filter(r =>
          [r.titulo, r.tipo, r.creadoPor, r.cursoNombre]
            .join(' ')
            .toLowerCase()
            .includes(busqueda.toLowerCase())
        );

  const ordenarReportes = arr =>
    [...arr].sort((a, b) => {
      if (ordenarPor === 'fecha')
        return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
      if (ordenarPor === 'titulo') return a.titulo.localeCompare(b.titulo);
      if (ordenarPor === 'tipo') return a.tipo.localeCompare(b.tipo);
      if (ordenarPor === 'curso')
        return (a.cursoNombre || '').localeCompare(b.cursoNombre || '');
      return 0;
    });

  const formatearFecha = iso =>
    new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

  const tiposLabels = {
    asistencia: 'Asistencia',
    incidente: 'Incidente',
    evaluacion: 'Evaluación',
    general: 'General'
  };
  const coloresTipos = {
    asistencia: 'bg-green-100 text-green-800',
    incidente: 'bg-red-100 text-red-800',
    evaluacion: 'bg-purple-100 text-purple-800',
    general: 'bg-blue-100 text-blue-800'
  };
  const formatearTipo = t => tiposLabels[t] || t;
  const getColorTipo = t => coloresTipos[t] || 'bg-gray-100 text-gray-800';

  /* --------------------------- render -------------------------- */
  if (!usuario) return null;
  const reportesOrdenados = ordenarReportes(filtrarReportes());

  return (
    <div className="p-6 space-y-6">
      {/* título y botón */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold">Reportes</h2>
        <button
          onClick={() => setMostrarFormulario(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition mt-4 md:mt-0"
        >
          <i className="ri-add-line mr-2"></i>
          Nuevo Reporte
        </button>
      </div>

      {/* búsqueda + orden */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar reportes..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <i className="ri-search-line absolute left-3 top-3 text-gray-400"></i>
        </div>
        <div className="w-full sm:w-48">
          <select
            value={ordenarPor}
            onChange={e => setOrdenarPor(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="fecha">Ordenar por fecha</option>
            <option value="titulo">Ordenar por título</option>
            <option value="tipo">Ordenar por tipo</option>
            <option value="curso">Ordenar por curso</option>
          </select>
        </div>
      </div>

      {/* lista de reportes */}
      {reportesOrdenados.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-gray-100">
            <i className="ri-file-list-3-line text-4xl text-gray-400"></i>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No hay reportes</h3>
          <p className="mt-2 text-sm text-gray-500">
            {busqueda
              ? `No se encontraron reportes para "${busqueda}"`
              : 'Aún no hay reportes creados. Crea tu primer reporte.'}
          </p>
          <div className="mt-6">
            <button
              onClick={() => setMostrarFormulario(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              <i className="ri-add-line mr-2"></i>
              Crear Reporte
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportesOrdenados.map(reporte => (
            <div
              key={reporte.id}
              className="bg-white rounded-xl shadow overflow-hidden flex flex-col h-full"
            >
              <div className="p-6 flex-grow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg text-gray-800 line-clamp-2">
                    {reporte.titulo}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getColorTipo(
                      reporte.tipo
                    )}`}
                  >
                    {formatearTipo(reporte.tipo)}
                  </span>
                </div>

                {reporte.descripcion && (
                  <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                    {reporte.descripcion}
                  </p>
                )}

                {reporte.imagenes && reporte.imagenes.length > 0 && (
                  <div className="my-3 flex flex-wrap gap-2">
                    {reporte.imagenes.slice(0, 3).map((img, idx) => (
                      <div
                        key={idx}
                        className="w-16 h-16 relative rounded overflow-hidden"
                      >
                        <img
                          src={img}
                          alt={`Imagen ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {reporte.imagenes.length > 3 && idx === 2 && (
                          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white">
                            +{reporte.imagenes.length - 3}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <i className="ri-calendar-line mr-2 text-gray-400"></i>
                    <span>{formatearFecha(reporte.fecha)}</span>
                  </div>

                  {reporte.cursoNombre && (
                    <div className="flex items-center">
                      <i className="ri-book-open-line mr-2 text-gray-400"></i>
                      <span>{reporte.cursoNombre}</span>
                    </div>
                  )}

                  <div className="flex items-center">
                    <i className="ri-user-line mr-2 text-gray-400"></i>
                    <span>{reporte.creadoPor}</span>
                  </div>
                </div>
              </div>
              <div className="border-t p-4 flex gap-2">
                <button
                  onClick={() => {
                    setReporteSeleccionado(reporte);
                    setVerDetalle(true);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition flex items-center justify-center"
                >
                  <i className="ri-eye-line mr-1"></i> Ver
                </button>
                <button className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center justify-center">
                  <i className="ri-download-line mr-1"></i> Descargar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------------- Modal NUEVO REPORTE ---------------- */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-screen overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Crear Nuevo Reporte</h3>
                <button
                  onClick={() => setMostrarFormulario(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título del Reporte
                  </label>
                  <input
                    type="text"
                    name="titulo"
                    value={nuevoReporte.titulo}
                    onChange={handleInputChange}
                    placeholder="Ej: Informe de asistencia"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Curso Relacionado
                    </label>
                    <select
                      name="cursoId"
                      value={nuevoReporte.cursoId}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Seleccionar curso</option>
                      {cursos.map(curso => (
                        <option key={curso.id} value={curso.id}>
                          {curso.cursoNombre || curso.titulo || 'Sin título'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Reporte
                    </label>
                    <select
                      name="tipo"
                      value={nuevoReporte.tipo}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Seleccionar tipo</option>
                      <option value="asistencia">Asistencia</option>
                      <option value="incidente">Incidente</option>
                      <option value="evaluacion">Evaluación</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha del Reporte
                  </label>
                  <input
                    type="date"
                    name="fecha"
                    value={nuevoReporte.fecha}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción del Reporte
                  </label>
                  <textarea
                    name="descripcion"
                    value={nuevoReporte.descripcion}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Describe los detalles del reporte aquí..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imágenes
                  </label>
                  <div className="flex items-center justify-center border-2 border-gray-300 border-dashed rounded-md p-3">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white text-blue-600 hover:text-blue-500 flex flex-col items-center"
                    >
                      <i className="ri-upload-2-line text-2xl"></i>
                      <span className="mt-1 text-sm">Subir imágenes</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        accept="image/*"
                        onChange={handleImagenChange}
                      />
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF</p>
                    </label>
                  </div>
                </div>

                {/* previsualización */}
                {previewImagenes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Imágenes seleccionadas
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {previewImagenes.map((img, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={img}
                            alt={`Vista previa ${idx + 1}`}
                            className="h-16 w-full object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => eliminarImagen(idx)}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 text-xs"
                          >
                            <i className="ri-close-line"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setMostrarFormulario(false)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                  >
                    Guardar Reporte
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Modal DETALLE REPORTE ---------------- */}
      {verDetalle && reporteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Detalle del Reporte</h3>
                <button
                  onClick={() => setVerDetalle(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800">
                    {reporteSeleccionado.titulo}
                  </h2>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getColorTipo(
                      reporteSeleccionado.tipo
                    )}`}
                  >
                    {formatearTipo(reporteSeleccionado.tipo)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Fecha:</span>
                    <span className="ml-2 text-gray-800">
                      {formatearFecha(reporteSeleccionado.fecha)}
                    </span>
                  </div>

                  {reporteSeleccionado.cursoNombre && (
                    <div>
                      <span className="text-gray-500">Curso:</span>
                      <span className="ml-2 text-gray-800">
                        {reporteSeleccionado.cursoNombre}
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="text-gray-500">Creado por:</span>
                    <span className="ml-2 text-gray-800">
                      {reporteSeleccionado.creadoPor}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500">Fecha de creación:</span>
                    <span className="ml-2 text-gray-800">
                      {formatearFecha(reporteSeleccionado.fechaCreacion)}
                    </span>
                  </div>
                </div>

                {reporteSeleccionado.descripcion && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </h4>
                    <p className="text-gray-600 text-sm whitespace-pre-line">
                      {reporteSeleccionado.descripcion}
                    </p>
                  </div>
                )}

                {reporteSeleccionado.imagenes &&
                  reporteSeleccionado.imagenes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        Imágenes
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {reporteSeleccionado.imagenes.map((img, idx) => (
                          <div key={idx}>
                            <img
                              src={img}
                              alt={`Imagen ${idx + 1}`}
                              className="w-full h-24 object-cover rounded-md"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="flex justify-end space-x-3 pt-3 border-t">
                  <button
                    onClick={() => setVerDetalle(false)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                  >
                    Cerrar
                  </button>
                  <button className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">
                    <i className="ri-download-line mr-1"></i> Descargar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
