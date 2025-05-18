// src/componentes/Layout.jsx
import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout({ children }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex">
      {/* wrapper exclusivo para la barra  */}
      <div
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="flex-shrink-0"
      >
        <Sidebar isOpen={isOpen} />
      </div>

      <div className="flex-1 flex flex-col">
        <Topbar isOpen={isOpen} />
        <main
          className={`
            flex-1 pt-16 transition-all duration-200
            ${isOpen ? 'pl-64' : 'pl-20'}
          `}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
