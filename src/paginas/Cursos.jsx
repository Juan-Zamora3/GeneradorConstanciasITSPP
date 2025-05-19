import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  addDoc
} from 'firebase/firestore';
import { AuthContext } from '../contexto/AuthContext';
import { db } from '../servicios/firebaseConfig';

export default function Cursos() {
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);

  const [cursos, setCursos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('titulo');
  const [showModal, setShowModal] = useState(false);
  const [showDetalles, setShowDetalles] = useState(false);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);

  /* ---------- leer colección "Cursos" en tiempo real ---------- */
  useEffect(() => {
    if (!usuario) {
      navigate('/login', { replace: true });
      return;
    }

    // ✅ corregido: segundo argumento de orderBy solo puede ser 'asc' o 'desc'
    const q = query(
      collection(db, 'Cursos'),
      orderBy('fechaInicio', 'asc')
    );

    const unsub = onSnapshot(
      q,
      snap => {
        const data = snap.docs.map(doc => {
          const d = doc.data();

          /* ---- adaptar nombres de campos del documento al UI ---- */
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
            ubicacion: d.ubicacion || ''
          };
        });
        setCursos(data);
      },
      err => {
        console.error('Error al obtener cursos:', err);
        alert(`Error al cargar cursos: ${err.message}`);
      }
    );

    return () => unsub();
  }, [usuario, navigate]);

  /* ---------- utilidades de búsqueda y orden ---------- */
  const filtrarCursos = () => {
    if (!searchTerm) return cursos;
    return cursos.filter(c =>
      c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.categoria || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
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

  /* ---------- crear nuevo documento ---------- */
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

  const mostrarDetalles = curso => {
    setCursoSeleccionado(curso);
    setShowDetalles(true);
  };

  /* ---------- funciones de formato ---------- */
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

  /* ------------------------------ render ----------------------------- */
  if (!usuario) return null;
  const cursosOrdenados = ordenarCursos(filtrarCursos());

  return (
    <div className="p-6 space-y-6">
      {/* título y botón */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold">Gestión de Cursos</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition mt-4 md:mt-0"
        >
          <i className="ri-add-line mr-2" />
          Nuevo Curso
        </button>
      </div>

      {/* búsqueda + orden */}
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
      </div>

      {/* grid de cursos */}
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
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getColorEstado(
                      curso.estado
                    )}`}
                  >
                    {formatearEstado(curso.estado)}
                  </span>
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
                </div>
              </div>
              <div className="border-t p-4 flex gap-2">
                <button
                  onClick={() => mostrarDetalles(curso)}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition flex items-center justify-center"
                >
                  <i className="ri-eye-line mr-1" /> Ver
                </button>
                <button className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center justify-center">
                  <i className="ri-edit-line mr-1" /> Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------- Modal NUEVO CURSO ------------------- */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                {/* ---------- grid formulario ---------- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Título</label>
                    <input
                      type="text"
                      name="titulo"
                      value={nuevoCurso.titulo}
                      onChange={handleInputChange}
                      placeholder="Introducción a React"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Lista</label>
                    <input
                      type="text"
                      name="lista"
                      value={nuevoCurso.lista}
                      onChange={handleInputChange}
                      placeholder="Lista del curso"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Fecha Inicio</label>
                    <input
                      type="date"
                      name="fechaInicio"
                      value={nuevoCurso.fechaInicio}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Fecha Fin</label>
                    <input
                      type="date"
                      name="fechaFin"
                      value={nuevoCurso.fechaFin}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Instructor</label>
                    <input
                      type="text"
                      name="instructor"
                      value={nuevoCurso.instructor}
                      onChange={handleInputChange}
                      placeholder="Nombre del instructor"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Categoría</label>
                    <select
                      name="categoria"
                      value={nuevoCurso.categoria}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
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

                {/* ---------- ubicación ---------- */}
                <div>
                  <label className="block text-sm font-medium mb-1">Ubicación</label>
                  <input
                    type="text"
                    name="ubicacion"
                    value={nuevoCurso.ubicacion}
                    onChange={handleInputChange}
                    placeholder="Sala, aula o ubicación del curso"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* ---------- descripción ---------- */}
                <div>
                  <label className="block text-sm font-medium mb-1">Descripción</label>
                  <textarea
                    name="descripcion"
                    value={nuevoCurso.descripcion}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Descripción del curso..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* ---------- botones ---------- */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Guardar Curso
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- Modal DETALLES CURSO ------------------- */}
      {showDetalles && cursoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
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

              <div className="space-y-4">
                <div
                  className={`h-2 ${getColorCategoria(cursoSeleccionado.categoria)} rounded-full mb-4`}
                />

                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-bold">{cursoSeleccionado.titulo}</h2>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getColorEstado(
                      cursoSeleccionado.estado
                    )}`}
                  >
                    {formatearEstado(cursoSeleccionado.estado)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Instructor</h4>
                    <p className="text-gray-900">{cursoSeleccionado.instructor}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Categoría</h4>
                    <p className="text-gray-900">
                      {formatearCategoria(cursoSeleccionado.categoria)}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">
                      Fecha de inicio
                    </h4>
                    <p className="text-gray-900">
                      {cursoSeleccionado.fechaInicio
                        ? new Date(cursoSeleccionado.fechaInicio).toLocaleDateString(
                            'es-MX'
                          )
                        : 'Sin fecha'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">
                      Fecha de finalización
                    </h4>
                    <p className="text-gray-900">
                      {cursoSeleccionado.fechaFin
                        ? new Date(cursoSeleccionado.fechaFin).toLocaleDateString(
                            'es-MX'
                          )
                        : 'Sin fecha'}
                    </p>
                  </div>

                  {cursoSeleccionado.ubicacion && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Ubicación</h4>
                      <p className="text-gray-900">{cursoSeleccionado.ubicacion}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">
                      Participantes
                    </h4>
                    <p className="text-gray-900">
                      {cursoSeleccionado.participantes?.length || 0}
                    </p>
                  </div>
                </div>

                {cursoSeleccionado.descripcion && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Descripción</h4>
                    <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                      {cursoSeleccionado.descripcion}
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowDetalles(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cerrar
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
