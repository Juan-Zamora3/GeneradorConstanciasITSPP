// src/rutas/RutasApp.jsx
import React, { useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexto/AuthContext';

import Login          from '../paginas/Login';
import Inicio         from '../paginas/Inicio';
import Personal       from '../paginas/Personal';
import Constancias    from '../paginas/Constancias';
import Cursos         from '../paginas/Cursos';
import Perfil         from '../paginas/Perfil';
import CrearUsuarios  from '../paginas/CrearUsuarios';
import AsistenciaForm from '../paginas/AsistenciaForm';
import Layout         from '../componentes/Layout';
import RegistroGrupo  from '../paginas/RegistroGrupo';
import PantallaCajero from '../paginas/PantallaCajero';
import CursosCajero from '../paginas/CursosCajero';
import EquiposCurso from '../paginas/EquiposCurso';
import SeleccionarIntegrantes from '../paginas/SeleccionarIntegrantes';
import EditarConstancias from '../paginas/EditarConstancias';
import ConfirmarPago from '../paginas/ConfirmarPago';
import ImprimirConstancias from '../paginas/ImprimirConstancias';
import ProcesoPago from '../paginas/ProcesoPago';
import Plantillas from '../paginas/plantillas';
import EditorPlantilla from '../paginas/EditorPlantilla';

import {
  LOGIN_PATH,
  ROOT_REDIRECTS_TO_LOGIN,
  KEEP_LEGACY_LOGIN_PATH,
  LEGACY_LOGIN_PATH,
} from '../utilidades/rutasConfig';

const PROTECTED_ROUTES = [
  '/inicio',
  '/personal',
  '/constancias',
  '/cursos',
  '/perfil',
  '/usuarios',
  '/plantillas',
];

export default function RutasApp() {
  const { usuario } = useContext(AuthContext);
  const location = useLocation();
  const sanitizedPath = location.pathname.replace(/\/+$/u, '') || '/';

  // Fallback para usuarios no autenticados
  let unauthenticatedFallback = <Navigate to={LOGIN_PATH} replace />;

  if (!KEEP_LEGACY_LOGIN_PATH) {
    if (LOGIN_PATH !== LEGACY_LOGIN_PATH && sanitizedPath === LEGACY_LOGIN_PATH) {
      unauthenticatedFallback = <Navigate to="/" replace />;
    } else if (
      !PROTECTED_ROUTES.includes(sanitizedPath) &&
      sanitizedPath !== LOGIN_PATH
    ) {
      unauthenticatedFallback = <Navigate to="/" replace />;
    }
  }

  // 🔹 loginRoutes se define solo una vez
  const loginRoutes = [LOGIN_PATH];
  if (KEEP_LEGACY_LOGIN_PATH && LOGIN_PATH !== LEGACY_LOGIN_PATH) {
    loginRoutes.push(LEGACY_LOGIN_PATH);
  }

  // 🔹 landingElement se define solo una vez
  const landingElement = ROOT_REDIRECTS_TO_LOGIN
    ? <Navigate to={LOGIN_PATH} replace />
    : <RegistroGrupo />;

  return (
    <Routes>
      {/* ---------- Rutas públicas ---------- */}
      <Route path="/" element={landingElement} />

      {/* Formulario por ID antiguo */}
      <Route path="/registro/:encuestaId" element={<RegistroGrupo />} />

      {/* Formulario por slug */}
      <Route path="/:slug" element={<RegistroGrupo />} />

      {/* Formulario de asistencia público */}
      <Route path="/asistencia/:cursoId" element={<AsistenciaForm />} />

      {/* Login */}
      {loginRoutes.map((path) => (
        <Route
          key={path}
          path={path}
          element={!usuario ? <Login /> : <Navigate to={usuario.role === 'cajero' ? '/pantalla-cajero' : '/inicio'} replace />}
        />
      ))}

      {/* ---------- Rutas protegidas (requieren login) ---------- */}
      {usuario && (
        <>
          {/* Ruta para usuario cajero */}
          <Route 
            path="/pantalla-cajero"
            element={<PantallaCajero />}
          />
          <Route 
            path="/cursos-cajero"
            element={<CursosCajero />}
          />
          
          {/* Ruta para equipos de un curso específico */}
          <Route path="/equipos-curso/:cursoId" element={<EquiposCurso />} />
          
          {/* Rutas del flujo de constancias */}
          <Route path="/seleccionar-integrantes/:cursoId/:equipoId" element={<SeleccionarIntegrantes />} />
          <Route path="/editar-constancias/:cursoId/:equipoId" element={<EditarConstancias />} />
          <Route path="/confirmar-pago/:cursoId/:equipoId" element={<ConfirmarPago />} />
          <Route path="/proceso-pago/:cursoId/:equipoId" element={<ProcesoPago />} />
          <Route path="/imprimir-constancias/:cursoId/:equipoId" element={<ImprimirConstancias />} />
          <Route
            path="/inicio"
            element={<Layout><Inicio /></Layout>}
          />
          <Route
            path="/personal"
            element={<Layout><Personal /></Layout>}
          />
          <Route
            path="/constancias"
            element={<Layout><Constancias /></Layout>}
          />
          <Route
            path="/cursos"
            element={<Layout><Cursos /></Layout>}
          />
          <Route
            path="/perfil"
            element={<Layout><Perfil /></Layout>}
          />
          <Route
            path="/usuarios"
            element={<Layout><CrearUsuarios /></Layout>}
          />
          <Route
            path="/plantillas"
            element={<Layout><Plantillas /></Layout>}
          />
          <Route
            path="/plantillas/:id"
            element={<EditorPlantilla />}
          />
        </>
      )}

      {/* ---------- Fallback ---------- */}
      <Route
        path="*"
        element={usuario ? <Navigate to={usuario.role === 'cajero' ? '/pantalla-cajero' : '/inicio'} replace /> : unauthenticatedFallback}
      />
    </Routes>
  );
}
