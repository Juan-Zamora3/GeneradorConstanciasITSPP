// src/componentes/Sidebar.jsx
import React, { useContext, useState, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import {
  FaHome,
  FaCalendarCheck,
  FaCertificate,
  FaChartBar,
  FaBook
} from 'react-icons/fa'
import { AuthContext } from '../contexto/AuthContext'
import logoImg from '../assets/logo.png'

export default function Sidebar() {
  const { usuario } = useContext(AuthContext)

  const menuItems = [
    { path: '/inicio',      name: 'Inicio',      icon: <FaHome /> },
    { path: '/asistencias', name: 'Asistencias', icon: <FaCalendarCheck /> },
    { path: '/constancias', name: 'Constancias', icon: <FaCertificate /> },
    { path: '/reportes',    name: 'Reportes',    icon: <FaChartBar /> },
    { path: '/cursos',      name: 'Cursos',      icon: <FaBook /> },
  ]

  // Estado interno para el hover y retardo al cerrar
  const [isOpen, setIsOpen] = useState(false)
  const closeTimer = useRef(null)

  const handleMouseEnter = () => {
    // si había un cierre pendiente, lo cancelamos
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    // esperamos 200ms antes de cerrar para evitar parpadeos
    closeTimer.current = setTimeout(() => {
      setIsOpen(false)
    }, 200)
  }

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        fixed top-0 left-0 h-screen bg-gray-900 text-gray-300
        flex flex-col transition-all duration-200 ease-in-out z-30
        ${isOpen ? 'w-64' : 'w-20'}
      `}
    >
      {/* LOGO + SALUDO */}
      <div className="flex flex-col items-center justify-center h-20">
        <img
          src={logoImg}
          alt="Logo"
          className={`transition-all duration-200 ${isOpen ? 'h-12' : 'h-10'}`}
        />
        {isOpen && usuario && (
          <p className="mt-1 text-gray-400 text-sm truncate">
            Hola, {usuario.name}
          </p>
        )}
      </div>

      <hr className="border-gray-700" />

      {/* MENÚ */}
      <nav className="flex-1 mt-4">
        <ul>
          {menuItems.map(({ path, name, icon }) => (
            <li key={path} className="mb-1">
              <NavLink
                to={path}
                end
                className={({ isActive }) => `
                  flex items-center transition-colors duration-200 rounded-lg
                  ${isActive
                    ? 'bg-gray-800 text-teal-300'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                  ${isOpen
                    ? 'px-4 py-3 justify-start'
                    : 'p-4 justify-center'}
                `}
              >
                {React.cloneElement(icon, {
                  // iconos un poco más grandes incluso en modo cerrado
                  size: isOpen ? 35 : 60
                })}
                <span
                  className={`
                    ml-4 text-base font-medium truncate
                    transition-opacity duration-200
                    ${isOpen ? 'opacity-100' : 'opacity-0'}
                  `}
                >
                  {name}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
