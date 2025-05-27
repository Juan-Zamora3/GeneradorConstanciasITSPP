import React, { useContext, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { FaHome, FaUser, FaFileSignature, FaBook, FaUserPlus } from 'react-icons/fa'
import { AuthContext } from '../contexto/AuthContext'
import logoImg from '../assets/logo.png'

export default function Sidebar({ isOpen, setIsOpen }) {
  const { usuario } = useContext(AuthContext)
  const closeTimer = useRef(null)

  /** --- Hover handlers --- */
  const handleMouseEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setIsOpen(true)
  }
  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setIsOpen(false), 200)
  }

  /** --- Secciones --- */
  const sections = [
    {
      title: 'Principal',
      items: [{ path: '/inicio', name: 'Inicio', icon: <FaHome /> }],
    },
    {
      title: 'Gestión',
      items: [
        { path: '/personal', name: 'Personal', icon: <FaUser /> },
        { path: '/constancias', name: 'Constancias', icon: <FaFileSignature /> },
        { path: '/cursos', name: 'Cursos', icon: <FaBook /> },
        { path: '/usuarios', name: 'Usuarios', icon: <FaUserPlus /> },
      ],
    },
  ]
  const allowedForUser = ['/inicio', '/personal', '/cursos']

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        fixed top-0 left-0 h-screen bg-gray-900 text-gray-300
        flex flex-col transition-[width] duration-200 ease-in-out z-30
        ${isOpen ? 'w-64' : 'w-20'}
      `}
    >
      {/* LOGO */}
      <div className="flex items-center justify-center h-20">
        <img src={logoImg} alt="Logo" className={`${isOpen ? 'h-12' : 'h-10'} transition-all`} />
      </div>
      <hr className="border-gray-700" />

      {/* MENÚ */}
      <nav className="flex-1 mt-4 overflow-y-auto">
        {sections.map(sec => {
          const items = sec.items.filter(item =>
            usuario?.role === 'user' ? allowedForUser.includes(item.path) : true
          )
          if (!items.length) return null

          return (
            <div key={sec.title} className="mb-6">
              {isOpen && (
                <h3 className="px-4 py-2 text-xs text-gray-500 uppercase">{sec.title}</h3>
              )}
              <ul>
                {items.map(({ path, name, icon }) => (
                  <li key={path} className="mb-1">
                    <NavLink
                      to={path}
                      end
                      className={({ isActive }) => `
                        flex items-center rounded-lg transition-colors duration-200
                        ${isActive ? 'bg-gray-800 text-teal-300' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                        ${isOpen ? 'px-4 py-3 justify-start' : 'p-4 justify-center'}
                      `}
                    >
                      <div className={`${isOpen ? 'text-2xl' : 'text-5xl'}`}>{icon}</div>
                      {isOpen && <span className="ml-4 text-base font-medium truncate">{name}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
