import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexto/AuthContext'

export default function Participantes() {
  const navigate = useNavigate()
  const { usuario } = useContext(AuthContext)
  const [participantes, setParticipantes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDetalles, setShowDetalles] = useState(false)
  const [participanteSeleccionado, setParticipanteSeleccionado] = useState(null)
  const [loading, setLoading] = useState(false)

  // Formulario para nuevo participante
  const [nuevoParticipante, setNuevoParticipante] = useState({
    nombre: '',
    apellidos: '',
    correo: '',
    area: '',
    telefono: ''
  })

  useEffect(() => {
    if (!usuario) {
      navigate('/login', { replace: true })
    } else {
      // Aquí se cargarían los participantes desde la base de datos
      setLoading(true)
      // Simulamos carga
      setTimeout(() => {
        setLoading(false)
      }, 500)
    }
  }, [usuario, navigate])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNuevoParticipante({
      ...nuevoParticipante,
      [name]: value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Aquí se enviaría el nuevo participante a la base de datos
    const nuevoParticipanteConId = {
      ...nuevoParticipante,
      id: Date.now()
    }
    setParticipantes([...participantes, nuevoParticipanteConId])
    setNuevoParticipante({
      nombre: '',
      apellidos: '',
      correo: '',
      area: '',
      telefono: ''
    })
    setShowModal(false)
  }

  const mostrarDetalles = (participante) => {
    setParticipanteSeleccionado(participante)
    setShowDetalles(true)
  }

  const filtrarParticipantes = () => {
    if (!searchTerm) return participantes
    
    return participantes.filter(participante => 
      participante.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participante.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participante.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participante.area.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const getAvatarInitials = (nombre, apellidos) => {
    return nombre.charAt(0) + (apellidos ? apellidos.charAt(0) : '')
  }

  const getRandomColor = (id) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-yellow-100 text-yellow-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800'
    ]
    const index = id ? id % colors.length : Math.floor(Math.random() * colors.length)
    return colors[index]
  }

  const participantesFiltrados = filtrarParticipantes()

  if (!usuario) return null

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold">Gestión de Participantes</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition mt-4 md:mt-0"
        >
          <i className="ri-user-add-line mr-2"></i>
          Nuevo Participante
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Buscar participantes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <i className="ri-search-line absolute left-3 top-3 text-gray-400"></i>
      </div>

      {/* Grid de participantes */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow p-6 h-48 animate-pulse"
            />
          ))}
        </div>
      ) : participantesFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-gray-100">
            <i className="ri-user-search-line text-4xl text-gray-400"></i>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No hay participantes
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchTerm
              ? `No se encontraron participantes para "${searchTerm}"`
              : "Aún no hay participantes registrados. Agrega tu primer participante."}
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              <i className="ri-user-add-line mr-2"></i>
              Agregar Participante
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {participantesFiltrados.map(participante => (
            <div 
              key={participante.id} 
              className="bg-white rounded-xl shadow overflow-hidden flex flex-col h-full"
            >
              <div className="p-6 flex-grow">
                <div className="flex items-center mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm ${getRandomColor(participante.id)}`}>
                    {getAvatarInitials(participante.nombre, participante.apellidos)}
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-800">{participante.nombre} {participante.apellidos}</h3>
                    <p className="text-sm text-gray-500">{participante.area}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <i className="ri-mail-line mr-2 text-gray-400"></i>
                    <span className="truncate">{participante.correo}</span>
                  </div>
                  {participante.telefono && (
                    <div className="flex items-center">
                      <i className="ri-phone-line mr-2 text-gray-400"></i>
                      <span>{participante.telefono}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t p-4 flex gap-2">
                <button 
                  onClick={() => mostrarDetalles(participante)}
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

      {/* Modal para Nuevo Participante */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Registrar Nuevo Participante</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={nuevoParticipante.nombre}
                    onChange={handleInputChange}
                    placeholder="Nombre del participante"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                  <input
                    type="text"
                    name="apellidos"
                    value={nuevoParticipante.apellidos}
                    onChange={handleInputChange}
                    placeholder="Apellidos del participante"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                  <input
                    type="email"
                    name="correo"
                    value={nuevoParticipante.correo}
                    onChange={handleInputChange}
                    placeholder="correo@ejemplo.com"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                  <select
                    name="area"
                    value={nuevoParticipante.area}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccionar área</option>
                    <option value="Ing. Sistemas Computacionales">Ing. Sistemas Computacionales</option>
                    <option value="Lic. Administración">Lic. Administración</option>
                    <option value="Ing. Industrial">Ing. Industrial</option>
                    <option value="Ing. Civil">Ing. Civil</option>
                    <option value="Docente">Docente</option>
                    <option value="Recursos Humanos">Recursos Humanos</option>
                    <option value="Limpieza y Mantenimiento">Limpieza y Mantenimiento</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (opcional)</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={nuevoParticipante.telefono}
                    onChange={handleInputChange}
                    placeholder="(123) 456-7890"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
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
                    Registrar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles del Participante */}
      {showDetalles && participanteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Detalles del Participante</h3>
                <button onClick={() => setShowDetalles(false)} className="text-gray-400 hover:text-gray-600">
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
              
              <div className="flex items-center mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl ${getRandomColor(participanteSeleccionado.id)}`}>
                  {getAvatarInitials(participanteSeleccionado.nombre, participanteSeleccionado.apellidos)}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold">{participanteSeleccionado.nombre} {participanteSeleccionado.apellidos}</h3>
                  <p className="text-gray-500">{participanteSeleccionado.area}</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Correo electrónico</p>
                  <p className="font-medium">{participanteSeleccionado.correo}</p>
                </div>
                
                {participanteSeleccionado.telefono && (
                  <div>
                    <p className="text-sm text-gray-500">Teléfono</p>
                    <p className="font-medium">{participanteSeleccionado.telefono}</p>
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4 pb-2">
                <h4 className="font-medium mb-2">Cursos inscritos</h4>
                {/* Aquí se mostrarían los cursos del participante desde la base de datos */}
                <div className="text-center text-gray-500 py-4">
                  Este participante no está inscrito en ningún curso
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Constancias obtenidas</h4>
                {/* Aquí se mostrarían las constancias del participante desde la base de datos */}
                <div className="text-center text-gray-500 py-4">
                  Este participante no tiene constancias generadas
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetalles(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cerrar
                </button>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                  <i className="ri-edit-line mr-2"></i>
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}