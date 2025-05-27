// src/paginas/CrearUsuarios.jsx
import React, { useState } from 'react'
import { useUsuarios }                        from '../utilidades/useUsuarios'
import NewEditUsuarioModal                    from '../componentes/PantallaCrearUsuario/NewEditUsuarioModal'
import UsuarioCard                            from '../componentes/PantallaCrearUsuario/UsuarioCard'

export default function CrearUsuarios() {
  const { usuarios, loading, error, addUsuario, removeUsuario } = useUsuarios()
  const [showModal, setShowModal] = useState(false)

  const handleCreate = async data => {
    try {
      await addUsuario(data)
      setShowModal(false)
    } catch (err) {
      alert(err.message)
    }
  }

  // Solo mostrar los usuarios con role === 'user'
  const usuariosUser = usuarios.filter(u => u.role === 'user')

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Gestión de Usuarios</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Nuevo Usuario
        </button>
      </header>

      {error && <p className="text-red-600">{error.message}</p>}

      {loading ? (
        <p>Cargando usuarios…</p>
      ) : usuariosUser.length === 0 ? (
        <p>No hay usuarios “user” aún.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {usuariosUser.map(u => (
            <UsuarioCard
              key={u.id}
              usuario={u}
              onDelete={removeUsuario}
            />
          ))}
        </div>
      )}

      <NewEditUsuarioModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreate}
      />
    </div>
  )
}
