// src/App.jsx
import React, { useEffect } from 'react'
import RutasApp from './rutas/RutasApp'
import { AuthProvider } from './contexto/AuthContext';
import { NotificationProvider } from './contexto/NotificationContext';

export default function App() {
  // Función para detectar si estamos en Trae IDE
  const isTraeIDE = () => {
    // Detectar Trae IDE por múltiples métodos
    const userAgent = navigator.userAgent.toLowerCase();
    const isElectron = userAgent.includes('electron');
    const isTraeUserAgent = userAgent.includes('trae') || userAgent.includes('traeai');
    
    // Detectar por variables globales específicas de Trae
    const hasTraeGlobals = window.traeAI || window.trae || window.__TRAE__;
    
    // Detectar por el título de la ventana o URL específica
    const isTraeURL = window.location.href.includes('trae') || 
                      document.title.includes('Trae') ||
                      window.location.hostname === 'localhost' && isElectron;
    
    // Detectar por características específicas del entorno Trae
    const hasTraeFeatures = window.electronAPI || window.ipcRenderer;
    
    return isTraeUserAgent || hasTraeGlobals || (isElectron && (isTraeURL || hasTraeFeatures));
  };

  const isTrae = isTraeIDE();

  // Aplicar clase CSS al body para controlar las protecciones
  useEffect(() => {
    if (isTrae) {
      document.body.classList.add('trae-ide');
    } else {
      document.body.classList.remove('trae-ide');
    }
    
    // Cleanup: remover la clase al desmontar el componente
    return () => {
      document.body.classList.remove('trae-ide');
    };
  }, [isTrae]);

  useEffect(() => {

    // Deshabilitar clic derecho solo si NO es Trae
    const handleContextMenu = (e) => {
      if (!isTrae) {
        e.preventDefault();
        return false;
      }
    };

    // Deshabilitar teclas de acceso rápido para herramientas de desarrollador solo si NO es Trae
    const handleKeyDown = (e) => {
      if (isTrae) {
        // Permitir todas las teclas en Trae IDE
        return true;
      }

      // F12 - Herramientas de desarrollador
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+I - Inspeccionar elemento
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+C - Selector de elementos
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+U - Ver código fuente
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+J - Consola
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+S - Guardar página (permitir en Trae para guardar archivos)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        return false;
      }
    };

    // Deshabilitar selección de texto con arrastrar solo si NO es Trae
    const handleSelectStart = (e) => {
      if (!isTrae) {
        e.preventDefault();
        return false;
      }
    };

    // Deshabilitar arrastrar elementos solo si NO es Trae
    const handleDragStart = (e) => {
      if (!isTrae) {
        e.preventDefault();
        return false;
      }
    };

    // Agregar event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);

    // Deshabilitar herramientas de desarrollador mediante detección solo si NO es Trae
    const detectDevTools = () => {
      if (isTrae) {
        // No aplicar detección de DevTools en Trae IDE
        return;
      }

      const threshold = 160;
      const interval = setInterval(() => {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
          // Si se detectan herramientas de desarrollador abiertas
          document.body.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial; font-size: 24px; color: #dc2626;">Acceso no autorizado detectado</div>';
        }
      }, 500);

      // Retornar el interval para poder limpiarlo
      return interval;
    };

    const devToolsInterval = detectDevTools();

    // Agregar indicador visual discreto cuando se está ejecutando en Trae
    if (isTrae && process.env.NODE_ENV === 'development') {
      console.log('🔧 Trae IDE detectado - Herramientas de desarrollador habilitadas');
    }

    // Cleanup function
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
      
      // Limpiar el interval de detección de DevTools si existe
      if (devToolsInterval) {
        clearInterval(devToolsInterval);
      }
    };
  }, []);

  return (
    <AuthProvider>
        <NotificationProvider>
          <RutasApp />
        </NotificationProvider>
      </AuthProvider>
  )
}