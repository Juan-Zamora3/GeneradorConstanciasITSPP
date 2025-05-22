import React, { useEffect, useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexto/AuthContext'
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where
} from 'firebase/firestore'
import { db } from '../servicios/firebaseConfig'

export default function Inicio() {
  const navigate = useNavigate()
  const { usuario, logout } = useContext(AuthContext)
  const [user, setUser] = useState(null)
  const [timeFrame, setTimeFrame] = useState('2024-1')
  const [loading, setLoading] = useState(true)
  
  // Estados para datos reales
  const [participantes, setParticipantes] = useState([])
  const [cursos, setCursos] = useState([])
  const [statsData, setStatsData] = useState({
    participantCount: 0,
    activeCourseCount: 0, 
    completedCourseCount: 0,
    totalReports: 0
  })

  useEffect(() => {
    if (!usuario) {
      navigate('/login', { replace: true })
    } else {
      setUser(usuario)
    }
  }, [usuario, navigate])

  // Cargar datos de participantes
  useEffect(() => {
    if (!usuario) return

    const alumnosRef = collection(db, 'Alumnos')
    const q = query(alumnosRef, orderBy('Nombres', 'asc'))

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => {
        const docData = d.data()
        return {
          id: d.id,
          nombre: docData.Nombres || '',
          apellidos: `${docData.ApellidoP || ''} ${docData.ApellidoM || ''}`.trim(),
          correo: docData.Correo || '',
          area: docData.Puesto || '',
          telefono: docData.Telefono || '',
          createdAt: docData.createdAt
        }
      })
      setParticipantes(data)
    })

    return () => unsubscribe()
  }, [usuario])

  // Cargar datos de cursos
  useEffect(() => {
    if (!usuario) return

    const cursosRef = collection(db, 'Cursos')
    const q = query(cursosRef, orderBy('fechaInicio', 'asc'))

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => {
        const d = doc.data()
        return {
          id: doc.id,
          titulo: d.cursoNombre || 'Sin título',
          instructor: d.asesor || 'Sin instructor',
          fechaInicio: d.fechaInicio || '',
          fechaFin: d.fechaFin || '',
          categoria: d.categoria || 'sin_categoria',
          estado: d.estado || 'proximo',
          participantes: d.asistencia?.[0]?.estudiantes || [],
          descripcion: d.descripcion || '',
          ubicacion: d.ubicacion || '',
          reportes: d.reportes || []
        }
      })
      setCursos(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [usuario])

  // Calcular estadísticas cuando cambien los datos
  useEffect(() => {
    const activeCourses = cursos.filter(c => c.estado === 'en_curso' || c.estado === 'proximo')
    const completedCourses = cursos.filter(c => c.estado === 'completado')
    const totalReports = cursos.reduce((sum, curso) => sum + (curso.reportes?.length || 0), 0)

    setStatsData({
      participantCount: participantes.length,
      activeCourseCount: activeCourses.length,
      completedCourseCount: completedCourses.length,
      totalReports: totalReports
    })
  }, [participantes, cursos])

  // Obtener próximos cursos (solo próximos o en curso, ordenados por fecha)
  const getProximosCursos = () => {
    const today = new Date()
    return cursos
      .filter(curso => {
        if (!curso.fechaInicio) return false
        const fechaInicio = new Date(curso.fechaInicio)
        return (curso.estado === 'proximo' || curso.estado === 'en_curso')
      })
      .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio))
      .slice(0, 6) // Mostrar máximo 6 cursos
  }

  // Obtener actividad reciente (últimos reportes)
  const getActividadReciente = () => {
    const reportesRecientes = []
    
    cursos.forEach(curso => {
      if (curso.reportes && curso.reportes.length > 0) {
        curso.reportes.forEach(reporte => {
          reportesRecientes.push({
            ...reporte,
            cursoTitulo: curso.titulo,
            cursoId: curso.id
          })
        })
      }
    })

    return reportesRecientes
      .sort((a, b) => new Date(b.fechaCreacion || b.fecha) - new Date(a.fechaCreacion || a.fecha))
      .slice(0, 5)
  }

  const formatTrend = (value) => {
    return value >= 0 ? `+${value}%` : `${value}%`;
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha'
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatearEstado = (estado) => {
    const estados = {
      proximo: 'Próximo',
      en_curso: 'En Curso',
      completado: 'Completado',
      cancelado: 'Cancelado'
    }
    return estados[estado] || estado
  }

  const formatearTipoReporte = (tipo) => {
    const tipos = {
      asistencia: 'Asistencia',
      incidente: 'Incidente',
      evaluacion: 'Evaluación',
      general: 'General'
    }
    return tipos[tipo] || tipo
  }

  const getColorEstado = (estado) => {
    const colores = {
      proximo: 'bg-blue-100 text-blue-800',
      en_curso: 'bg-green-100 text-green-800',
      completado: 'bg-purple-100 text-purple-800',
      cancelado: 'bg-red-100 text-red-800'
    }
    return colores[estado] || 'bg-gray-100 text-gray-800'
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const proximosCursos = getProximosCursos()
  const actividadReciente = getActividadReciente()

  if (!user) return null

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="bg-gray-200 rounded-xl h-20 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-xl h-32"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Tarjeta de bienvenida */}
      <div className="bg-white rounded-xl shadow p-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">¡Bienvenido, {user.nombre || user.email}!</h2>
          <p className="text-gray-600">({user.email})</p>
          <p className="text-sm text-gray-500 mt-1">
            Sistema de Gestión de Cursos y Participantes
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          <i className="ri-logout-box-line mr-2"></i>
          Cerrar sesión
        </button>
      </div>

      {/* Encabezado y selector de periodo */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Panel de Control</h2>
        <div className="mt-4 md:mt-0">
          <select 
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
            className="border-gray-300 border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="2023-1">Ene-Jun 2023</option>
            <option value="2023-2">Jul-Dic 2023</option>
            <option value="2024-1">Ene-Jun 2024</option>
            <option value="2024-2">Jul-Dic 2024</option>
          </select>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Participantes */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center">
              <i className="ri-user-line text-xl text-blue-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Total Participantes</p>
              <h4 className="text-2xl font-semibold">{statsData.participantCount}</h4>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-green-600 flex items-center">
              <i className="ri-arrow-up-line mr-1"></i>
              {formatTrend(12)}
            </span>
            <span className="text-gray-400 text-sm">vs mes anterior</span>
          </div>
        </div>

        {/* Cursos Activos */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center">
              <i className="ri-book-open-line text-xl text-green-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Cursos Activos</p>
              <h4 className="text-2xl font-semibold">{statsData.activeCourseCount}</h4>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-green-600 flex items-center">
              <i className="ri-arrow-up-line mr-1"></i>
              +{statsData.activeCourseCount > 0 ? Math.min(3, statsData.activeCourseCount) : 0}
            </span>
            <span className="text-gray-400 text-sm">cursos activos</span>
          </div>
        </div>

        {/* Cursos Completados */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center">
              <i className="ri-file-list-3-line text-xl text-purple-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Cursos Completados</p>
              <h4 className="text-2xl font-semibold">{statsData.completedCourseCount}</h4>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-green-600 flex items-center">
              <i className="ri-arrow-up-line mr-1"></i>
              {formatTrend(24)}
            </span>
            <span className="text-gray-400 text-sm">vs mes anterior</span>
          </div>
        </div>

        {/* Total Reportes */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center mb-4">
            <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center">
              <i className="ri-file-text-line text-xl text-orange-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Total Reportes</p>
              <h4 className="text-2xl font-semibold">{statsData.totalReports}</h4>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-green-600 flex items-center">
              <i className="ri-arrow-up-line mr-1"></i>
              +{statsData.totalReports > 0 ? Math.min(5, statsData.totalReports) : 0}
            </span>
            <span className="text-gray-400 text-sm">reportes creados</span>
          </div>
        </div>
      </div>

      {/* Próximos cursos */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Próximos Cursos</h3>
          <button 
            onClick={() => navigate('/cursos')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Ver todos →
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de inicio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participantes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {proximosCursos.length > 0 ? proximosCursos.map(curso => (
                <tr key={curso.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{curso.titulo}</div>
                    <div className="text-sm text-gray-500">{curso.descripcion?.substring(0, 50)}{curso.descripcion?.length > 50 ? '...' : ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {curso.instructor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatearFecha(curso.fechaInicio)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColorEstado(curso.estado)}`}>
                      {formatearEstado(curso.estado)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {curso.participantes?.length || 0}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td className="px-6 py-4 text-center text-gray-500" colSpan="5">
                    No hay cursos próximos para mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Actividad Reciente</h3>
          <button 
            onClick={() => navigate('/cursos')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Ver todos los reportes →
          </button>
        </div>
        
        <div className="space-y-4">
          {actividadReciente.length > 0 ? actividadReciente.map((actividad, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="ri-file-text-line text-blue-600 text-sm"></i>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  Nuevo reporte: {actividad.titulo}
                </p>
                <p className="text-sm text-gray-500">
                  {formatearTipoReporte(actividad.tipo)} en {actividad.cursoTitulo}
                </p>
                <p className="text-xs text-gray-400">
                  {formatearFecha(actividad.fechaCreacion || actividad.fecha)} • {actividad.creadoPor}
                </p>
              </div>
            </div>
          )) : (
            <div className="text-center text-gray-500 py-4">
              <i className="ri-file-line text-3xl mb-2 block"></i>
              <p>No hay actividad reciente para mostrar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}