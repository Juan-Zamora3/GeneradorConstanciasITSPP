// src/componentes/Topbar.jsx
import React, { useState, useContext, useRef, useEffect } from 'react'
import { FaSearch, FaThLarge, FaBell, FaCog, FaUser } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexto/AuthContext'

export default function Topbar({ isOpen, toggleSidebar }) {
  const [showMenu, setShowMenu] = useState(false)
  const [showNotificaciones, setShowNotificaciones] = useState(false)
  const { logout, usuario } = useContext(AuthContext)
  const navigate = useNavigate()
  const notificacionesRef = useRef(null)
  const menuRef = useRef(null)

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

  return (
    <header
      className={`
        fixed top-0
        ${isOpen ? 'left-64' : 'left-20'} right-0
        h-16 bg-white shadow flex items-center px-6 z-20
        transition-all duration-200 ease-in-out
      `}
    >
      {/* Foto de usuario (solo decorativa) */}
      <div className="w-10 h-10 rounded-full overflow-hidden mr-4">
        {usuario && usuario.foto ? (
          <img src={usuario.foto} alt="Foto de perfil" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white">
            <FaUser />
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center bg-gray-100 rounded-lg px-3 py-2 max-w-lg">
        <FaSearch className="text-gray-500 mr-2" />
        <input
          type="text"
          placeholder="Search..."
          className="flex-grow bg-transparent outline-none text-sm"
        />
      </div>
      <div className="ml-auto flex items-center space-x-4 text-gray-600 relative">
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <FaThLarge size={18} />
        </button>

        {/* Botón de notificaciones con menú desplegable */}
        <div className="relative" ref={notificacionesRef}>
          <button 
            className="p-2 hover:bg-gray-100 rounded-lg"
            onClick={toggleNotificaciones}
          >
            <FaBell size={18} />
          </button>
          
          {/* Menú de notificaciones */}
          {showNotificaciones && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
              <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-medium text-gray-800">Notificaciones</h3>
                <span className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                  Marcar todas como leídas
                </span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="px-4 py-8 text-sm text-gray-600 text-center">
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                      <FaBell size={20} />
                    </div>
                  </div>
                  <p>No hay notificaciones</p>
                  <p className="text-xs mt-1 text-gray-500">
                    Las notificaciones aparecerán aquí
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botón de configuración con menú desplegable */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={toggleMenu}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FaCog size={18} />
          </button>

          {showMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-30">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="font-medium text-sm">{usuario?.nombre || 'Usuario'}</p>
                <p className="text-xs text-gray-500">{usuario?.correo || ''}</p>
              </div>
              <button
                onClick={() => { setShowMenu(false); navigate('/perfil') }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Mi perfil
              </button>
              <hr className="my-1 border-gray-200" />
              <button
                onClick={() => { setShowMenu(false); handleLogout() }}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}