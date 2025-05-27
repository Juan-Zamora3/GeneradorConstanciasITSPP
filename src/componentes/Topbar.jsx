// src/componentes/TopbarCompact.jsx
import React, { useState, useContext, useRef, useEffect } from 'react';
import { FaBell, FaCog, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexto/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../servicios/firebaseConfig';

export default function TopbarCompact({ isOpen }) {
  const { logout, usuario } = useContext(AuthContext);
  const [perfil, setPerfil] = useState({
    nombre: '',
    apellidos: '',
    correo: '',
    rol: '',
    imagen: ''
  });
  const [notOpen, setNotOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const notRef = useRef(), menuRef = useRef();
  const navigate = useNavigate();

  // Carga datos del perfil desde Firestore
  useEffect(() => {
    if (!usuario) return;
    const uref = doc(db, 'Usuarios', usuario.email);
    const unsubscribe = onSnapshot(uref, snap => {
      const d = snap.data() || {};
      setPerfil({
        nombre: d.nombre || d.name || usuario.displayName || 'Usuario',
        apellidos: d.apellidos || '',
        correo: d.email || usuario.email || '',
        rol: d.rol || d.role || 'Usuario',
        imagen: d.imagen || ''
      });
    });
    return () => unsubscribe();
  }, [usuario]);

  // Cierra dropdowns al clicar fuera
  useEffect(() => {
    const handler = e => {
      if (notRef.current && !notRef.current.contains(e.target)) setNotOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fullName = `${perfil.nombre} ${perfil.apellidos}`.trim();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className={`fixed top-0 right-0 left-${isOpen ? '64' : '20'} h-16 bg-white shadow flex items-center px-4 z-20 transition-all`}>
      {/* Avatar + nombre + rol */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-blue-100 bg-gray-100">
          {perfil.imagen
            ? <img src={perfil.imagen} alt="Avatar" className="object-cover w-full h-full"/>
            : <div className="w-full h-full flex items-center justify-center text-white bg-blue-200">
                <FaUser size={18}/>
              </div>
          }
        </div>
        <div>
          <p className="font-semibold text-gray-800">{fullName || 'Usuario'}</p>
          <p className="text-xs text-gray-500">{perfil.rol}</p>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1"/>

      {/* Notificaciones */}
      <div className="relative mr-4" ref={notRef}>
        <button
          onClick={() => { setNotOpen(o => !o); setMenuOpen(false); }}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <FaBell className="text-gray-600"/>
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
            3
          </span>
        </button>
        {notOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-30">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Notificaciones</h3>
              <span className="text-xs text-blue-600 cursor-pointer hover:text-blue-800 font-medium">
                Marcar todas como leídas
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {/* Ejemplos */}
              <div className="px-4 py-3 hover:bg-gray-50 border-b cursor-pointer flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="ri-book-line text-blue-600 text-lg"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">Nuevo curso agregado</p>
                  <p className="text-xs text-gray-600">Se ha creado un nuevo curso de Informática</p>
                  <p className="text-xs text-gray-400 mt-1">Hace 2 horas</p>
                </div>
              </div>
              <div className="px-4 py-3 hover:bg-gray-50 border-b cursor-pointer flex items-start space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="ri-user-add-line text-green-600 text-lg"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">Nuevo participante</p>
                  <p className="text-xs text-gray-600">Se registró un nuevo participante</p>
                  <p className="text-xs text-gray-400 mt-1">Hace 4 horas</p>
                </div>
              </div>
              <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-start space-x-3">
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
        )}
      </div>

      {/* Menú usuario */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => { setMenuOpen(o => !o); setNotOpen(false); }}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <FaCog className="text-gray-600"/>
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-30">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-blue-100">
                {perfil.imagen
                  ? <img src={perfil.imagen} alt="Avatar" className="object-cover w-full h-full"/>
                  : <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                      <FaUser size={16}/>
                    </div>
                }
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800">{fullName || 'Usuario'}</p>
                <p className="text-xs text-gray-600">{perfil.correo}</p>
                <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full mt-1">
                  {perfil.rol}
                </span>
              </div>
            </div>
            <button
              onClick={() => { setMenuOpen(false); navigate('/perfil'); }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
            >
              <FaUser className="text-gray-500"/> <span>Mi perfil</span>
            </button>
            <button
              onClick={() => { setMenuOpen(false); handleLogout(); }}
              className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center space-x-2"
            >
              <i className="ri-logout-box-line text-lg"></i> <span>Cerrar sesión</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
