// src/rutas/RutasApp.jsx
import React, { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthContext } from '../contexto/AuthContext'

import Login       from '../paginas/Login'
import Inicio      from '../paginas/Inicio'
import Asistencias from '../paginas/Asistencias'
import Constancias from '../paginas/Constancias'
import Reportes    from '../paginas/Reportes'
import Cursos      from '../paginas/Cursos'
import Layout      from '../componentes/Layout'

export default function RutasApp() {
  const { usuario } = useContext(AuthContext)

  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          !usuario
            ? <Login />
            : <Navigate to="/inicio" replace />
        }
      />

      {/* Rutas protegidas, solo si hay usuario */}
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
            path="/asistencias"
            element={
              <Layout>
                <Asistencias />
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
            path="/reportes"
            element={
              <Layout>
                <Reportes />
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
        </>
      )}

      {/* Cualquier otra ruta va a login o, si ya está auth, a inicio */}
      <Route
        path="*"
        element={
          usuario
            ? <Navigate to="/inicio" replace />
            : <Navigate to="/login" replace />
        }
      />
    </Routes>
  )
}
