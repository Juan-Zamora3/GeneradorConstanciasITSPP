// src/componentes/Topbar.jsx
import React, { useState, useContext } from 'react'
import { FaSearch, FaThLarge, FaBell, FaCog } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexto/AuthContext'

export default function Topbar({ isOpen }) {
  const [showMenu, setShowMenu] = useState(false)
  const { logout } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
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
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <FaBell size={18} />
        </button>
        <button
          onClick={() => setShowMenu(v => !v)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <FaCog size={18} />
        </button>

        {showMenu && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-30">
            <button
              onClick={() => { setShowMenu(false); navigate('/perfil') }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Mi perfil
            </button>
            <button
              onClick={() => { setShowMenu(false); /* navigate('/ajustes') */ }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Ajustes
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
    </header>
  )
}
