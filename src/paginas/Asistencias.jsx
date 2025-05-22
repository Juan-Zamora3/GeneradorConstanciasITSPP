import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexto/AuthContext'
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../servicios/firebaseConfig'

export default function Participantes () {
  const navigate = useNavigate()
  const { usuario } = useContext(AuthContext)

  /* ──────────────── STATE ──────────────── */
  const [participantes, setParticipantes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('nombre') // Nuevo estado para ordenamiento
  const [filterByArea, setFilterByArea] = useState('') // Nuevo estado para filtro por área
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [showDetalles, setShowDetalles] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const [participanteSeleccionado, setParticipanteSeleccionado] = useState(null)

  // formulario «nuevo»
  const [nuevoParticipante, setNuevoParticipante] = useState({
    nombre: '',
    apellidos: '',
    correo: '',
    area: '',
    telefono: ''
  })

  // formulario «editar»
  const [editParticipante, setEditParticipante] = useState({
    id: '',
    nombre: '',
    apellidos: '',
    correo: '',
    area: '',
    telefono: ''
  })

  /* ──────────────── SUSCRIPCIÓN ──────────────── */
  useEffect(() => {
    if (!usuario) {
      navigate('/login', { replace: true })
      return
    }

    const alumnosRef = collection(db, 'Alumnos')
    // ordenamos por el campo real «Nombres»
    const q = query(alumnosRef, orderBy('Nombres', 'asc'))

    const unsubscribe = onSnapshot(
      q,
      snap => {
        const data = snap.docs.map(d => {
          const docData = d.data()
          return {
            id: d.id,
            nombre: docData.Nombres || '',
            apellidos:
              `${docData.ApellidoP || ''} ${docData.ApellidoM || ''}`.trim(),
            correo: docData.Correo || '',
            area: docData.Puesto || '',
            telefono: docData.Telefono || '',
            createdAt: docData.createdAt
          }
        })
        setParticipantes(data)
        setLoading(false)
      },
      err => {
        console.error('Error al obtener alumnos:', err)
        alert(`Error al cargar alumnos: ${err.message}`)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [usuario, navigate])

  /* ──────────────── HANDLERS ──────────────── */
  const handleInputChange = e =>
    setNuevoParticipante({ ...nuevoParticipante, [e.target.name]: e.target.value })

  const handleEditInputChange = e =>
    setEditParticipante({ ...editParticipante, [e.target.name]: e.target.value })

  /* ── crear ── */
  const handleSubmit = async e => {
    e.preventDefault()
    try {
      await addDoc(collection(db, 'Alumnos'), {
        Nombres: nuevoParticipante.nombre,
        ApellidoP: nuevoParticipante.apellidos.split(' ')[0] || '',
        ApellidoM: nuevoParticipante.apellidos.split(' ')[1] || '',
        Correo: nuevoParticipante.correo,
        Puesto: nuevoParticipante.area,
        Telefono: nuevoParticipante.telefono,
        createdAt: serverTimestamp()
      })
      setNuevoParticipante({
        nombre: '',
        apellidos: '',
        correo: '',
        area: '',
        telefono: ''
      })
      setShowModal(false)
      alert('Participante agregado correctamente')
    } catch (err) {
      console.error('Error añadiendo participante:', err)
      alert(`Error al añadir participante: ${err.message}`)
    }
  }

  /* ── actualizar ── */
  const handleEditSubmit = async e => {
    e.preventDefault()
    if (!editParticipante.id) return
    try {
      await updateDoc(doc(db, 'Alumnos', editParticipante.id), {
        Nombres: editParticipante.nombre,
        ApellidoP: editParticipante.apellidos.split(' ')[0] || '',
        ApellidoM: editParticipante.apellidos.split(' ')[1] || '',
        Correo: editParticipante.correo,
        Puesto: editParticipante.area,
        Telefono: editParticipante.telefono
      })
      setShowEditModal(false)
      alert('Participante actualizado correctamente')
    } catch (err) {
      console.error('Error actualizando participante:', err)
      alert(`Error al actualizar participante: ${err.message}`)
    }
  }

  /* ── eliminar ── */
  const handleDelete = async () => {
    if (!participanteSeleccionado) return
    try {
      await deleteDoc(doc(db, 'Alumnos', participanteSeleccionado.id))
      setShowDeleteModal(false)
      setParticipanteSeleccionado(null)
      alert('Participante eliminado correctamente')
    } catch (err) {
      console.error('Error eliminando participante:', err)
      alert(`Error al eliminar participante: ${err.message}`)
    }
  }

  /* ──────────────── UTILIDADES UI ──────────────── */
  const filtrarParticipantes = () => {
    let filtered = participantes;
    
    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(p =>
        `${p.nombre} ${p.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.area.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtro por área
    if (filterByArea) {
      filtered = filtered.filter(p => p.area.toLowerCase().includes(filterByArea.toLowerCase()));
    }
    
    return filtered;
  }

  const ordenarParticipantes = (arr) => {
    return [...arr].sort((a, b) => {
      if (sortBy === 'nombre') {
        return `${a.nombre} ${a.apellidos}`.localeCompare(`${b.nombre} ${b.apellidos}`);
      }
      if (sortBy === 'nombre-desc') {
        return `${b.nombre} ${b.apellidos}`.localeCompare(`${a.nombre} ${a.apellidos}`);
      }
      if (sortBy === 'area') {
        return a.area.localeCompare(b.area);
      }
      return 0;
    });
  }

  const getAvatarInitials = (nombre, apellidos) =>
    nombre.charAt(0) + (apellidos ? apellidos.charAt(0) : '')

  const getRandomColor = id => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-yellow-100 text-yellow-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800'
    ]
    const numeric = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    return colors[numeric % colors.length]
  }

  const participantesFiltrados = ordenarParticipantes(filtrarParticipantes())

  if (!usuario) return null

  /* ──────────────── RENDER ──────────────── */
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

      {/* Búsqueda + orden + filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar participantes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <i className="ri-search-line absolute left-3 top-3 text-gray-400"></i>
        </div>
        <div className="w-full sm:w-48">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="nombre">Ordenar A-Z</option>
            <option value="nombre-desc">Ordenar Z-A</option>
            <option value="area">Ordenar por Área</option>
          </select>
        </div>
        <div className="w-full sm:w-48">
          <select
            value={filterByArea}
            onChange={e => setFilterByArea(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas las áreas</option>
            {/* Obtener áreas únicas dinámicamente */}
            {[...new Set(participantes.map(p => p.area).filter(area => area))].map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>
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
              : 'Aún no hay participantes registrados. Agrega tu primer participante.'}
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
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm ${getRandomColor(
                      participante.id
                    )}`}
                  >
                    {getAvatarInitials(
                      participante.nombre,
                      participante.apellidos
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-800">
                      {participante.nombre} {participante.apellidos}
                    </h3>
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
                  onClick={() => {
                    setParticipanteSeleccionado(participante)
                    setShowDetalles(true)
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition flex items-center justify-center"
                >
                  <i className="ri-eye-line mr-1"></i> Ver
                </button>
                <button
                  onClick={() => {
                    setEditParticipante(participante)
                    setShowEditModal(true)
                  }}
                  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center justify-center"
                >
                  <i className="ri-edit-line mr-1"></i> Editar
                </button>
                <button
                  onClick={() => {
                    setParticipanteSeleccionado(participante)
                    setShowDeleteModal(true)
                  }}
                  className="w-10 h-10 bg-red-500 text-white rounded hover:bg-red-600 transition flex items-center justify-center"
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal ― Nuevo Participante */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">
                  Registrar Nuevo Participante
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={nuevoParticipante.nombre}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nombre del participante"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    name="apellidos"
                    value={nuevoParticipante.apellidos}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Apellidos del participante"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo electrónico *
                  </label>
                  <input
                    type="email"
                    name="correo"
                    value={nuevoParticipante.correo}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ejemplo@correo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Área/Puesto *
                  </label>
                  <input
                    type="text"
                    name="area"
                    value={nuevoParticipante.area}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Recursos Humanos, Ventas, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono (opcional)
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={nuevoParticipante.telefono}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="555-123-4567"
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
                    <i className="ri-save-line mr-2"></i>
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal ― Ver Detalles */}
      {showDetalles && participanteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Detalles del Participante</h3>
                <button
                  onClick={() => setShowDetalles(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center mb-6">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg ${getRandomColor(
                      participanteSeleccionado.id
                    )}`}
                  >
                    {getAvatarInitials(
                      participanteSeleccionado.nombre,
                      participanteSeleccionado.apellidos
                    )}
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-gray-800">
                      {participanteSeleccionado.nombre}{' '}
                      {participanteSeleccionado.apellidos}
                    </h4>
                    <p className="text-gray-600">{participanteSeleccionado.area}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo electrónico
                  </label>
                  <p className="text-gray-900">{participanteSeleccionado.correo}</p>
                </div>

                {participanteSeleccionado.telefono && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <p className="text-gray-900">{participanteSeleccionado.telefono}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Área/Puesto
                  </label>
                  <p className="text-gray-900">{participanteSeleccionado.area}</p>
                </div>
              </div>

              <div className="flex justify-end pt-6">
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

      {/* Modal ― Editar Participante */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Editar Participante</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={editParticipante.nombre}
                    onChange={handleEditInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    name="apellidos"
                    value={editParticipante.apellidos}
                    onChange={handleEditInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo electrónico *
                  </label>
                  <input
                    type="email"
                    name="correo"
                    value={editParticipante.correo}
                    onChange={handleEditInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Área/Puesto *
                  </label>
                  <input
                    type="text"
                    name="area"
                    value={editParticipante.area}
                    onChange={handleEditInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono (opcional)
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={editParticipante.telefono}
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
                    <i className="ri-save-line mr-2"></i>
                    Actualizar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal ― Confirmar Eliminación */}
      {showDeleteModal && participanteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-red-600">
                  Confirmar Eliminación
                </h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <i className="ri-error-warning-line text-2xl text-red-600"></i>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900">
                      ¿Estás seguro de eliminar este participante?
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Esta acción no se puede deshacer
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900">
                    {participanteSeleccionado.nombre}{' '}
                    {participanteSeleccionado.apellidos}
                  </p>
                  <p className="text-sm text-gray-500">
                    {participanteSeleccionado.correo}
                  </p>
                  <p className="text-sm text-gray-500">
                    {participanteSeleccionado.area}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                  <i className="ri-delete-bin-line mr-2"></i>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}