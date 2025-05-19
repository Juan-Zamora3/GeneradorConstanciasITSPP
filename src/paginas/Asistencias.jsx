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
    if (!searchTerm) return participantes
    return participantes.filter(p =>
      `${p.nombre} ${p.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.area.toLowerCase().includes(searchTerm.toLowerCase())
    )
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

  const participantesFiltrados = filtrarParticipantes()

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

      {/* Búsqueda */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Buscar participantes..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
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
                  className="w-10 h-10 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition flex items-center justify-center"
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
                    Nombre
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo electrónico
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Área
                  </label>
                  <select
                    name="area"
                    value={nuevoParticipante.area}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccionar área</option>
                    <option value="Ing. Sistemas Computacionales">
                      Ing. Sistemas Computacionales
                    </option>
                    <option value="Lic. Administración">Lic. Administración</option>
                    <option value="Ing. Industrial">Ing. Industrial</option>
                    <option value="Ing. Civil">Ing. Civil</option>
                    <option value="Docente">Docente</option>
                    <option value="Recursos Humanos">Recursos Humanos</option>
                    <option value="Limpieza y Mantenimiento">
                      Limpieza y Mantenimiento
                    </option>
                  </select>
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
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal ― Editar */}
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
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={editParticipante.nombre}
                    onChange={handleEditInputChange}
                    placeholder="Nombre del participante"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    name="apellidos"
                    value={editParticipante.apellidos}
                    onChange={handleEditInputChange}
                    placeholder="Apellidos del participante"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    name="correo"
                    value={editParticipante.correo}
                    onChange={handleEditInputChange}
                    placeholder="correo@ejemplo.com"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Área
                  </label>
                  <select
                    name="area"
                    value={editParticipante.area}
                    onChange={handleEditInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccionar área</option>
                    <option value="Ing. Sistemas Computacionales">
                      Ing. Sistemas Computacionales
                    </option>
                    <option value="Lic. Administración">Lic. Administración</option>
                    <option value="Ing. Industrial">Ing. Industrial</option>
                    <option value="Ing. Civil">Ing. Civil</option>
                    <option value="Docente">Docente</option>
                    <option value="Recursos Humanos">Recursos Humanos</option>
                    <option value="Limpieza y Mantenimiento">
                      Limpieza y Mantenimiento
                    </option>
                  </select>
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
                    placeholder="(123) 456-7890"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                  >
                    Actualizar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal ― Detalles */}
      {showDetalles && participanteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
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

              <div className="flex items-center mb-6">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center font-medium text-lg ${getRandomColor(
                    participanteSeleccionado.id
                  )}`}
                >
                  {getAvatarInitials(
                    participanteSeleccionado.nombre,
                    participanteSeleccionado.apellidos
                  )}
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold">
                    {participanteSeleccionado.nombre}{' '}
                    {participanteSeleccionado.apellidos}
                  </h3>
                  <p className="text-gray-500">{participanteSeleccionado.area}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start">
                  <i className="ri-mail-line text-gray-400 mt-0.5 mr-3 w-5"></i>
                  <div>
                    <p className="text-sm text-gray-500">Correo electrónico</p>
                    <p>{participanteSeleccionado.correo}</p>
                  </div>
                </div>

                {participanteSeleccionado.telefono && (
                  <div className="flex items-start">
                    <i className="ri-phone-line text-gray-400 mt-0.5 mr-3 w-5"></i>
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p>{participanteSeleccionado.telefono}</p>
                    </div>
                  </div>
                )}

                {participanteSeleccionado.createdAt && (
                  <div className="flex items-start">
                    <i className="ri-calendar-line text-gray-400 mt-0.5 mr-3 w-5"></i>
                    <div>
                      <p className="text-sm text-gray-500">Fecha de registro</p>
                      <p>
                        {participanteSeleccionado.createdAt.toDate
                          ? participanteSeleccionado.createdAt
                              .toDate()
                              .toLocaleDateString()
                          : 'Fecha no disponible'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetalles(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setShowDetalles(false)
                    setEditParticipante(participanteSeleccionado)
                    setShowEditModal(true)
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                >
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal ― Confirmar eliminar */}
      {showDeleteModal && participanteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-red-100 mb-4">
                  <i className="ri-delete-bin-line text-2xl text-red-500"></i>
                </div>
                <h3 className="text-xl font-semibold">¿Eliminar participante?</h3>
                <p className="mt-2 text-gray-500">
                  Esta acción no se puede deshacer. El participante será eliminado
                  permanentemente.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                >
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
