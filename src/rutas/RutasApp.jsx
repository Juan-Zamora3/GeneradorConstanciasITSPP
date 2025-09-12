import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from '../contexto/AuthContext';

import Login          from '../paginas/Login';
import Inicio         from '../paginas/Inicio';
import Personal       from '../paginas/Personal';
import Constancias    from '../paginas/Constancias';
import Cursos         from '../paginas/Cursos';
import Perfil         from '../paginas/Perfil';
import CrearUsuarios  from '../paginas/CrearUsuarios';
import Equipos        from '../paginas/Equipos';   // ← NUEVO
import AsistenciaForm from '../paginas/AsistenciaForm';   // ← NUEVO
import Layout         from '../componentes/Layout';
import RegistroGrupo from '../paginas/RegistroGrupo';

export default function RutasApp() {
  const { usuario } = useContext(AuthContext);

  return (
    <Routes>
      {/* ---------- Rutas públicas ---------- */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/registro/:encuestaId" element={<RegistroGrupo />} />

      {/* formulario de asistencia accesible SIN login */}
      <Route path="/asistencia/:cursoId" element={<AsistenciaForm />} />

      <Route
        path="/login"
        element={
          !usuario ? <Login /> : <Navigate to="/inicio" replace />
        }
      />

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
        element={
          usuario
            ? <Navigate to="/inicio" replace />
            : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
}
