// src/componentes/Topbar.jsx
import React, { useState, useContext, useRef, useEffect } from 'react'
import { FaThLarge, FaBell, FaCog, FaUser } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexto/AuthContext'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../servicios/firebaseConfig'

export default function Topbar({ isOpen, toggleSidebar }) {
  const [showMenu, setShowMenu] = useState(false)
  const [showNotificaciones, setShowNotificaciones] = useState(false)
  const [perfilData, setPerfilData] = useState({
    nombre: '',
    apellidos: '',
    correo: '',
    rol: '',
    imagen: ''
  })
  const { logout, usuario } = useContext(AuthContext)
  const navigate = useNavigate()
  const notificacionesRef = useRef(null)
  const menuRef = useRef(null)

  // Cargar datos del perfil desde Firebase
  useEffect(() => {
    if (!usuario) return

    const uid = usuario.email // usas email como ID de doc
    const userRef = doc(db, 'Usuarios', uid)

    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setPerfilData({
          nombre: data.name || data.nombre || 'Usuario',
          apellidos: data.apellidos || '',
          correo: data.email || usuario.email || '',
          rol: data.role || data.rol || 'Usuario',
          imagen: data.imagen || ''
        })
      } else {
        // Si no existe el documento, usar datos básicos del contexto
        setPerfilData({
          nombre: usuario.displayName || usuario.nombre || 'Usuario',
          apellidos: '',
          correo: usuario.email || '',
          rol: 'Usuario',
          imagen: ''
        })
      }
    })

    return () => unsubscribe()
  }, [usuario])

  // Cerrar menús al hacer clic fuera de ellos
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificacionesRef.current && !notificacionesRef.current.contains(event.target)) {
        setShowNotificaciones(false)
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const toggleNotificaciones = () => {
    setShowNotificaciones(!showNotificaciones)
    setShowMenu(false)
  }

  const toggleMenu = () => {
    setShowMenu(!showMenu)
    setShowNotificaciones(false)
  }

  const nombreCompleto = `${perfilData.nombre} ${perfilData.apellidos}`.trim()

  return (
    <header
      className={`
        fixed top-0
        ${isOpen ? 'left-64' : 'left-20'} right-0
        h-20 bg-white shadow flex items-center px-6 z-20
        transition-all duration-200 ease-in-out
      `}
    >
      {/* Foto de usuario desde Firebase - MÁS GRANDE */}
      <div className="w-14 h-14 rounded-full overflow-hidden mr-4 ring-2 ring-blue-100 shadow-sm">
        {perfilData.imagen ? (
          <img 
            src={perfilData.imagen} 
            alt="Foto de perfil" 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
            <FaUser size={20} />
          </div>
        )}
      </div>

      {/* Información del usuario - MEJORADA */}
      <div className="flex-1">
        <h2 className="text-lg font-bold text-gray-800 leading-tight">
          {nombreCompleto || 'Usuario'}
        </h2>
        <p className="text-sm font-medium text-gray-600">
          {perfilData.correo}
        </p>
        <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full mt-1">
          {perfilData.rol}
        </span>
      </div>

      {/* Iconos de acción */}
      <div className="ml-auto flex items-center space-x-3 text-gray-600 relative">
        <button className="p-3 hover:bg-gray-100 rounded-lg transition-colors">
          <FaThLarge size={20} />
        </button>

        {/* Botón de notificaciones con menú desplegable */}
        <div className="relative" ref={notificacionesRef}>
          <button 
            className="p-3 hover:bg-gray-100 rounded-lg transition-colors relative"
            onClick={toggleNotificaciones}
          >
            <FaBell size={20} />
            {/* Badge de notificaciones */}
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              3
            </span>
          </button>
          
          {/* Menú de notificaciones */}
          {showNotificaciones && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl py-1 z-50 border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Notificaciones</h3>
                <span className="text-xs text-blue-600 cursor-pointer hover:text-blue-800 font-medium">
                  Marcar todas como leídas
                </span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {/* Notificaciones de ejemplo */}
                <div className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 cursor-pointer">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <i className="ri-book-line text-blue-600 text-lg"></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">Nuevo curso agregado</p>
                      <p className="text-xs text-gray-600">Se ha creado un nuevo curso de Informática</p>
                      <p className="text-xs text-gray-400 mt-1">Hace 2 horas</p>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 cursor-pointer">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <i className="ri-user-add-line text-green-600 text-lg"></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">Nuevo participante</p>
                      <p className="text-xs text-gray-600">Se registró un nuevo participante</p>
                      <p className="text-xs text-gray-400 mt-1">Hace 4 horas</p>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <i className="ri-file-text-line text-purple-600 text-lg"></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">Reporte generado</p>
                      <p className="text-xs text-gray-600">Se creó un reporte de asistencia</p>
                      <p className="text-xs text-gray-400 mt-1">Hace 1 día</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botón de configuración con menú desplegable */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={toggleMenu}
            className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaCog size={20} />
          </button>

          {showMenu && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl z-30 border border-gray-200">
              <div className="px-4 py-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-blue-100">
                    {perfilData.imagen ? (
                      <img 
                        src={perfilData.imagen} 
                        alt="Foto de perfil" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                        <FaUser size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-base text-gray-800">
                      {nombreCompleto}
                    </p>
                    <p className="text-sm font-medium text-gray-600">
                      {perfilData.correo}
                    </p>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full mt-1">
                      {perfilData.rol}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setShowMenu(false); navigate('/perfil') }}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center space-x-3 transition-colors"
              >
                <FaUser size={16} className="text-gray-500" />
                <span className="font-medium">Mi perfil</span>
              </button>
              <button
                onClick={() => { setShowMenu(false); navigate('/configuracion') }}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center space-x-3 transition-colors"
              >
                <FaCog size={16} className="text-gray-500" />
                <span className="font-medium">Configuración</span>
              </button>
              <hr className="my-1 border-gray-200" />
              <button
                onClick={() => { setShowMenu(false); handleLogout() }}
                className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors font-medium"
              >
                <i className="ri-logout-box-line text-lg"></i>
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}