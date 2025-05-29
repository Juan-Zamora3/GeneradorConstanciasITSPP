// src/paginas/CrearUsuarios.jsx
import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';   // 🆕
import 'react-toastify/dist/ReactToastify.css';           // 🆕
import { useUsuarios } from '../utilidades/useUsuarios';

import NewEditUsuarioModal from '../componentes/PantallaCrearUsuario/NewEditUsuarioModal';
import UsuarioCard         from '../componentes/PantallaCrearUsuario/UsuarioCard';

/* ---------- VALIDACIÓN BÁSICA ---------- */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// VALIDACIÓN ACTUALIZADA
function validateUsuario(u) {
  const errs = [];
  if (!u.nombre?.trim()) errs.push('Nombre obligatorio');
  if (!emailRegex.test(u.correo || '')) errs.push('Correo inválido');

  // ✅ toma la primer propiedad que exista
  const pwd =
    u.contrasena ??     // sin eñe
    u.contraseña ??     // con eñe
    u.password ?? '';   // por si usas inglés

  if (pwd.length < 6) errs.push('Contraseña de al menos 6 caracteres');
  return errs;
}


export default function CrearUsuarios() {
  const { usuarios, loading, error, addUsuario, removeUsuario } = useUsuarios();
  const [showModal, setShowModal] = useState(false);

  const handleCreate = async data => {
    const fails = validateUsuario(data);
    if (fails.length) { toast.error(fails.join('\n')); return; }

    try {
      await addUsuario({ ...data, role: 'user' });   // fuerza role user
      toast.success('Usuario creado');
      setShowModal(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('¿Eliminar usuario?')) return;
    try {
      await removeUsuario(id);
      toast.info('Usuario eliminado');
    } catch (e) { toast.error(e.message); }
  };

  // Solo mostrar los usuarios con role === 'user'
  const usuariosUser = usuarios.filter(u => u.role === 'user');

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
              onDelete={() => handleDelete(u.id)}
            />
          ))}
        </div>
      )}

      <NewEditUsuarioModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreate}
      />

      {/* ALERTAS GLOBAL */}
      <ToastContainer
        position="top-right"
        autoClose={3200}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}
