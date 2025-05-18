import React, { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexto/AuthContext'

export default function Cursos() {
  const navigate = useNavigate()
  const { usuario } = useContext(AuthContext)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('titulo')
  const [showModal, setShowModal] = useState(false)
  const [cursos, setCursos] = useState([])

  // Formulario para nuevo curso (sin capacidadMax)
  const [nuevoCurso, setNuevoCurso] = useState({
    titulo: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    instructor: '',
    ubicacion: '',
    lista: ''
  })

  // Curso seleccionado para detalles
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null)
  const [showDetalles, setShowDetalles] = useState(false)

  useEffect(() => {
    if (!usuario) {
      navigate('/login', { replace: true })
    }
  }, [usuario, navigate])

  const filtrarCursos = () => {
    if (!searchTerm) return cursos
    
    return cursos.filter(curso => 
      curso.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      curso.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      curso.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const ordenarCursos = (cursosFiltrados) => {
    return [...cursosFiltrados].sort((a, b) => {
      if (sortBy === 'titulo') {
        return a.titulo.localeCompare(b.titulo)
      } else if (sortBy === 'fechaInicio') {
        return new Date(a.fechaInicio) - new Date(b.fechaInicio)
      } else if (sortBy === 'categoria') {
        return a.categoria.localeCompare(b.categoria)
      }
      return 0
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNuevoCurso({
      ...nuevoCurso,
      [name]: value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const nuevoCursoConId = {
      ...nuevoCurso,
      id: cursos.length + 1,
      participantes: []
    }
    setCursos([...cursos, nuevoCursoConId])
    setNuevoCurso({
      titulo: '',
      categoria: '',
      descripcion: '',
      fechaInicio: '',
      fechaFin: '',
      instructor: '',
      ubicacion: '',
      estado: 'proximo'
    })
    setShowModal(false)
  }

  const mostrarDetalles = (curso) => {
    setCursoSeleccionado(curso)
    setShowDetalles(true)
  }

  const formatearFechas = (fechaInicio, fechaFin) => {
    const inicio = new Date(fechaInicio)
    const fin = new Date(fechaFin)
    
    return `${inicio.toLocaleDateString('es-MX')} - ${fin.toLocaleDateString('es-MX')}`
  }

  const formatearCategoria = (categoria) => {
    switch (categoria) {
      case 'informatica': return 'Informática'
      case 'administracion': return 'Administración'
      case 'ingles': return 'Inglés'
      case 'marketing': return 'Marketing'
      case 'recursos_humanos': return 'Recursos Humanos'
      case 'desarrollo_personal': return 'Desarrollo Personal'
      default: return categoria
    }
  }

  const formatearEstado = (estado) => {
    switch (estado) {
      case 'proximo': return 'Próximo'
      case 'en_curso': return 'En Curso'
      case 'completado': return 'Completado'
      case 'cancelado': return 'Cancelado'
      default: return estado
    }
  }

  const getColorCategoria = (categoria) => {
    switch (categoria) {
      case 'informatica': return 'bg-blue-500'
      case 'administracion': return 'bg-green-500'
      case 'ingles': return 'bg-purple-500'
      case 'marketing': return 'bg-orange-500'
      case 'recursos_humanos': return 'bg-pink-500'
      case 'desarrollo_personal': return 'bg-indigo-500'
      default: return 'bg-gray-500'
    }
  }

  const getColorEstado = (estado) => {
    switch (estado) {
      case 'proximo': return 'bg-blue-100 text-blue-800'
      case 'en_curso': return 'bg-green-100 text-green-800'
      case 'completado': return 'bg-purple-100 text-purple-800'
      case 'cancelado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const cursosFiltrados = filtrarCursos()
  const cursosOrdenados = ordenarCursos(cursosFiltrados)

  if (!usuario) return null

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold">Gestión de Cursos</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition mt-4 md:mt-0"
        >
          <i className="ri-add-line mr-2"></i>
          Nuevo Curso
        </button>
      </div>

      {/* Búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar cursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <i className="ri-search-line absolute left-3 top-3 text-gray-400"></i>
        </div>
        <div className="w-full sm:w-48">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="titulo">Ordenar por título</option>
            <option value="fechaInicio">Ordenar por fecha de inicio</option>
            <option value="categoria">Ordenar por categoría</option>
          </select>
        </div>
      </div>

      {/* Grid de cursos */}
      {cursosOrdenados.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-gray-100">
            <i className="ri-folder-open-line text-4xl text-gray-400"></i>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No hay cursos
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchTerm
              ? `No se encontraron cursos para "${searchTerm}"`
              : "Aún no hay cursos creados. Agrega tu primer curso."}
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              <i className="ri-add-line mr-2"></i>
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
              <div className={`h-2 ${getColorCategoria(curso.categoria)}`}></div>
              <div className="p-6 flex-grow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg text-gray-800 line-clamp-2">{curso.titulo}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColorEstado(curso.estado)}`}>
                    {formatearEstado(curso.estado)}
                  </span>
                </div>
                <div className="mt-2 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <i className="ri-calendar-line mr-2 text-gray-400"></i>
                    <span>{formatearFechas(curso.fechaInicio, curso.fechaFin)}</span>
                  </div>
                  <div className="flex items-center">
                    <i className="ri-user-line mr-2 text-gray-400"></i>
                    <span>{curso.instructor}</span>
                  </div>
                  <div className="flex items-center">
                    <i className="ri-folder-line mr-2 text-gray-400"></i>
                    <span>{formatearCategoria(curso.categoria)}</span>
                  </div>
                  <div className="flex items-center">
                    <i className="ri-group-line mr-2 text-gray-400"></i>
                    <span>{curso.participantes?.length || 0} participantes</span>
                  </div>
                </div>
              </div>
              <div className="border-t p-4 flex gap-2">
                <button 
                  onClick={() => mostrarDetalles(curso)}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition flex items-center justify-center"
                >
                  <i className="ri-eye-line mr-1"></i> Ver
                </button>
                <button className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center justify-center">
                  <i className="ri-edit-line mr-1"></i> Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para Nuevo Curso */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Crear Nuevo Curso</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lista</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Fin</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                    <input
                      type="text"
                      name="ubicacion"
                      value={nuevoCurso.ubicacion}
                      onChange={handleInputChange}
                      placeholder="Sala de conferencias"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <select
                      name="categoria"
                      value={nuevoCurso.categoria || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="" disabled>Selecciona una categoría</option>
                      <option value="informatica">Informática</option>
                      <option value="administracion">Administración</option>
                      <option value="ingles">Inglés</option>
                      <option value="marketing">Marketing</option>
                      <option value="recursos_humanos">Recursos Humanos</option>
                      <option value="desarrollo_personal">Desarrollo Personal</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea
                      name="descripcion"
                      value={nuevoCurso.descripcion}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Descripción detallada del curso"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    ></textarea>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
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

      {/* Modal de Detalles */}
      {showDetalles && cursoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Detalles del Curso</h3>
                <button onClick={() => setShowDetalles(false)} className="text-gray-400 hover:text-gray-600">
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="md:w-2/3">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{cursoSeleccionado.titulo}</h2>
                    <div className="flex items-center space-x-2 mb-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColorEstado(cursoSeleccionado.estado)}`}>
                        {formatearEstado(cursoSeleccionado.estado)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getColorCategoria(cursoSeleccionado.categoria)}`}>
                        {formatearCategoria(cursoSeleccionado.categoria)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{cursoSeleccionado.descripcion || "Sin descripción"}</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Instructor</h4>
                        <p className="text-gray-800">{cursoSeleccionado.instructor}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Ubicación</h4>
                        <p className="text-gray-800">{cursoSeleccionado.ubicacion || "No especificada"}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Fechas</h4>
                        <p className="text-gray-800">{formatearFechas(cursoSeleccionado.fechaInicio, cursoSeleccionado.fechaFin)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Lista</h4>
                        <p className="text-gray-800">{cursoSeleccionado.lista || "No asignada"}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:w-1/3 bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">Participantes</h4>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-600">Total de participantes</p>
                      <p className="font-medium">{cursoSeleccionado.participantes?.length || 0}</p>
                    </div>
                    
                    <button className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center">
                      <i className="ri-user-add-line mr-2"></i> Agregar Participantes
                    </button>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-4">Lista de Participantes</h4>
                  
                  {(cursoSeleccionado.participantes?.length > 0) ? (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Área</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {/* Lista de participantes */}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gray-100">
                        <i className="ri-user-add-line text-3xl text-gray-400"></i>
                      </div>
                      <h5 className="mt-2 text-sm font-medium text-gray-900">No hay participantes</h5>
                      <p className="mt-1 text-sm text-gray-500">Aún no se han agregado participantes a este curso.</p>
                      <button className="mt-4 px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">
                        Agregar Participantes
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowDetalles(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cerrar
                  </button>
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                    <i className="ri-edit-line mr-1"></i> Editar Curso
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}