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
import Equipos        from '../paginas/Equipos';
import AsistenciaForm from '../paginas/AsistenciaForm';
import Layout         from '../componentes/Layout';
import RegistroGrupo  from '../paginas/RegistroGrupo';
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
  '/Equipos',
];

export default function RutasApp() {
  const { usuario } = useContext(AuthContext);
  const location = useLocation();
  const sanitizedPath = location.pathname.replace(/\/+$/u, '') || '/';

  let unauthenticatedFallback = <Navigate to={LOGIN_PATH} replace />;

  if (!KEEP_LEGACY_LOGIN_PATH) {
    if (LOGIN_PATH !== LEGACY_LOGIN_PATH && sanitizedPath === LEGACY_LOGIN_PATH) {
      unauthenticatedFallback = <Navigate to="/" replace />;
    } else if (!PROTECTED_ROUTES.includes(sanitizedPath) && sanitizedPath !== LOGIN_PATH) {
      unauthenticatedFallback = <Navigate to="/" replace />;
    }
  }

  const loginRoutes = [LOGIN_PATH];
  if (KEEP_LEGACY_LOGIN_PATH && LOGIN_PATH !== LEGACY_LOGIN_PATH) {
    loginRoutes.push(LEGACY_LOGIN_PATH);
  }

  const landingElement = ROOT_REDIRECTS_TO_LOGIN
    ? <Navigate to={LOGIN_PATH} replace />
    : <RegistroGrupo />;

  return (
    <Routes>
      {/* ---------- Rutas públicas ---------- */}
      <Route path="/" element={landingElement} />

      {/* Formulario por ID antiguo */}
      <Route path="/registro/:encuestaId" element={<RegistroGrupo />} />

      {/* Formulario por slug (NUEVO) → permite /seguridad-industrial */}
      <Route path="/:slug" element={<RegistroGrupo />} />

      {/* Formulario de asistencia público */}
      <Route path="/asistencia/:cursoId" element={<AsistenciaForm />} />

      {/* Login */}
      {loginRoutes.map((path) => (
        <Route
          key={path}
          path={path}
          element={!usuario ? <Login /> : <Navigate to="/inicio" replace />}
        />
      ))}

      {/* ---------- Rutas protegidas (requieren login) ---------- */}
      {usuario && (
        <>
          <Route
            path="/inicio"
            element={
              <Layout>
                <Inicio />
              </Layout>
            }
          />
          <Route
            path="/personal"
            element={
              <Layout>
                <Personal />
              </Layout>
            }
          />
          <Route
            path="/constancias"
            element={
              <Layout>
                <Constancias />
              </Layout>
            }
          />
          <Route
            path="/cursos"
            element={
              <Layout>
                <Cursos />
              </Layout>
            }
          />
          <Route
            path="/perfil"
            element={
              <Layout>
                <Perfil />
              </Layout>
            }
          />
          <Route
            path="/usuarios"
            element={
              <Layout>
                <CrearUsuarios />
              </Layout>
            }
          />
          <Route
            path="/Equipos"
            element={
              <Layout>
                <Equipos />
              </Layout>
            }
          />
        </>
      )}

      {/* ---------- Fallback ---------- */}
      <Route
        path="*"
        element={usuario ? <Navigate to="/inicio" replace /> : unauthenticatedFallback}
      />
    </Routes>
  );
}
