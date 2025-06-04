// src/componentes/TopbarCompact.jsx
import React, { useState, useContext, useRef, useEffect } from 'react';
import { FaBell, FaCog, FaUser, FaEye, FaBook, FaUserPlus, FaFileSignature } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexto/AuthContext';
import { useNotifications } from '../contexto/NotificationContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../servicios/firebaseConfig';

export default function TopbarCompact({ isOpen }) {
  const { logout, usuario } = useContext(AuthContext);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
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
  <header
    className={`fixed top-0 right-0 h-16 bg-white/80 backdrop-blur shadow-md flex items-center px-4 z-20 transition-all duration-300 ${isOpen ? 'left-64' : 'left-20'}`}
  >
    {/* Avatar + nombre + rol */}
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-blue-100 bg-gray-100">
        {perfil.imagen ? (
          <img src={perfil.imagen} alt="Avatar" className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white bg-blue-200">
            <FaUser size={18} />
          </div>
        )}
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
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        {notOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-30">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Notificaciones</h3>
              <span 
                onClick={markAllAsRead}
                className="text-xs text-blue-600 cursor-pointer hover:text-blue-800 font-medium"
              >
                Marcar todas como leídas
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <FaBell className="mx-auto text-gray-300 mb-2" size={24} />
                  <p className="text-sm">No hay notificaciones</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const getIcon = (tipo) => {
                    switch (tipo) {
                      case 'curso': return <FaBook className="text-blue-600" />;
                      case 'participante': return <FaUserPlus className="text-green-600" />;
                      case 'reporte': return <FaFileSignature className="text-purple-600" />;
                      case 'usuario': return <FaUser className="text-orange-600" />;
                      default: return <FaBell className="text-gray-600" />;
                    }
                  };
                  
                  const getBgColor = (tipo) => {
                    switch (tipo) {
                      case 'curso': return 'bg-blue-100';
                      case 'participante': return 'bg-green-100';
                      case 'reporte': return 'bg-purple-100';
                      case 'usuario': return 'bg-orange-100';
                      default: return 'bg-gray-100';
                    }
                  };

                  const formatDate = (timestamp) => {
                    if (!timestamp) return 'Ahora';
                    
                    // Convertir timestamp de Firestore a Date
                    let date;
                    if (timestamp?.toDate) {
                      date = timestamp.toDate();
                    } else if (timestamp?.seconds) {
                      date = new Date(timestamp.seconds * 1000);
                    } else {
                      date = new Date(timestamp);
                    }
                    
                    const now = new Date();
                    const diffMs = now - date;
                    const diffMinutes = Math.floor(diffMs / (1000 * 60));
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    
                    if (diffMinutes < 1) return 'Ahora mismo';
                    if (diffMinutes < 60) return `Hace ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`;
                    if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
                    return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
                  };

                  return (
                    <div 
                      key={notif.id}
                      className={`px-4 py-3 hover:bg-gray-50 border-b flex items-start space-x-3 ${!notif.leida ? 'bg-blue-50' : ''}`}
                    >
                      <div className={`w-10 h-10 ${getBgColor(notif.tipo)} rounded-full flex items-center justify-center`}>
                        {getIcon(notif.tipo)}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${!notif.leida ? 'font-semibold' : 'font-medium'} text-gray-800`}>
                          {notif.titulo}
                        </p>
                        <p className="text-xs text-gray-600">{notif.mensaje}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-400">{formatDate(notif.createdAt)}</p>
                          {notif.creadoPor && (
                            <p className="text-xs text-blue-600 font-medium">
                              por {notif.creadoPor.nombre}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!notif.leida && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notif.id);
                            }}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                            title="Marcar como leída"
                          >
                            <FaEye className="text-gray-500 text-sm" />
                          </button>
                        )}
                        {!notif.leida && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
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
