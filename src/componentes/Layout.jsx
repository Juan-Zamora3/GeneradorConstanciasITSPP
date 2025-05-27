import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar  from './TopbarCompact'      // ⬅️  sigue usando tu TopbarCompact

export default function Layout({ children }) {
  const [isOpen, setIsOpen] = useState(false)   // ← estado ÚNICO

  return (
    <div className="flex">
      {/* Barra lateral */}
      <Sidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}      // ⬅️  pasamos setter para que Sidebar controle el hover
      />

      {/* Zona de trabajo */}
      <div className="flex-1 flex flex-col">
        <Topbar isOpen={isOpen} />  {/* comparte el mismo estado */}
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
