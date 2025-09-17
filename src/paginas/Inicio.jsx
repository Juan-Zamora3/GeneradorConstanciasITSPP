import React, { useEffect, useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexto/AuthContext'
import { LOGIN_PATH } from '../utilidades/rutasConfig'
import {
  collection,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore'
import { db } from '../servicios/firebaseConfig'

export default function Inicio() {
  const navigate = useNavigate()
  const { usuario, logout } = useContext(AuthContext)
  const [user, setUser] = useState(null)
  const [timeFrame, setTimeFrame] = useState('1')
  const [participantFilter, setParticipantFilter] = useState('')
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
      navigate(LOGIN_PATH, { replace: true })
    } else {
      setUser(usuario)
    }
  }, [usuario, navigate])

  // Cargar datos de participantes
  useEffect(() => {
    if (!usuario) return

    const alumnosRef = collection(db, 'Personal')
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
          participantes: d.listas || [],
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
      let cursosProximos = cursos
      .filter(curso => {
        if (!curso.fechaInicio) return false
        const fechaInicio = new Date(curso.fechaInicio)
        const cumpleFiltroEstado = (curso.estado === 'proximo' || curso.estado === 'en_curso')
        
        // Si hay filtro de mes, aplicarlo
        if (participantFilter && participantFilter !== '') {
          const mesSeleccionado = parseInt(participantFilter)
          const mesCurso = fechaInicio.getMonth()
          return cumpleFiltroEstado && mesCurso === mesSeleccionado
        }
        
        return cumpleFiltroEstado
      })
      .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio))
      .slice(0, 6) // Mostrar máximo 6 cursos
    
    return cursosProximos
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
    navigate(LOGIN_PATH, { replace: true })
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

      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Panel de Control</h2>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total de Participantes */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center">
              <i className="ri-group-line text-xl text-blue-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Total de Participantes</p>
              <h4 className="text-2xl font-semibold">{statsData.participantCount}</h4>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-green-600 flex items-center">
              <i className="ri-arrow-up-line mr-1"></i>
              +12%
            </span>
            <span className="text-gray-400 text-sm">vs mes anterior</span>
          </div>
        </div>

        {/* Cursos Activos */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center">
              <i className="ri-graduation-cap-line text-xl text-green-600"></i>
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

        {/* Reportes */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center mb-4">
            <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center">
              <i className="ri-bar-chart-2-line text-xl text-orange-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Informes totales</p>
              <h4 className="text-2xl font-semibold">{statsData.totalReports}</h4>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-green-600 flex items-center">
              <i className="ri-arrow-up-line mr-1"></i>
              +1
            </span>
            <span className="text-gray-400 text-sm">informes creados</span>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica de Participantes por Curso Próximo */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <i className="ri-user-line text-blue-600 mr-2"></i>
              Participantes por Curso Próximo
            </h3>
            <select 
              value={participantFilter}
              onChange={(e) => setParticipantFilter(e.target.value)}
              className="border-gray-300 border rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los meses</option>
              <option value="0">Enero</option>
              <option value="1">Febrero</option>
              <option value="2">Marzo</option>
              <option value="3">Abril</option>
              <option value="4">Mayo</option>
              <option value="5">Junio</option>
              <option value="6">Julio</option>
              <option value="7">Agosto</option>
              <option value="8">Septiembre</option>
              <option value="9">Octubre</option>
              <option value="10">Noviembre</option>
              <option value="11">Diciembre</option>
            </select>
          </div>
          <div className="h-64 flex items-end justify-between space-x-2 border-b border-l border-gray-200 pl-2 pb-2">
            {proximosCursos.slice(0, 5).map(curso => {
              const participantesCount = Array.isArray(curso.participantes) ? curso.participantes.length : 0;
              const cursosParaEscala = proximosCursos.slice(0, 5);
              const maxParticipantes = Math.max(...cursosParaEscala.map(c => Array.isArray(c.participantes) ? c.participantes.length : 0), 1);
              const height = maxParticipantes === 0 ? 20 : Math.max((participantesCount / maxParticipantes) * 200, 20);
              
              return (
                <div key={curso.id} className="flex-1 flex flex-col justify-end items-center h-full">
                  <div className="w-full flex flex-col justify-end items-center h-full">
                    <span className="text-xs font-semibold text-gray-700 mb-1">
                      {participantesCount}
                    </span>
                    <div className="w-full flex justify-center">
                      <div 
                        className="w-12 bg-blue-600 rounded-t transition-all duration-500"
                        style={{height: `${height}px`}}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-xs font-medium text-gray-900 truncate max-w-[60px]" title={curso.titulo}>
                      {curso.titulo.length > 8 ? curso.titulo.substring(0, 8) + '...' : curso.titulo}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatearFecha(curso.fechaInicio).split(' ')[0]}
                    </p>
                  </div>
                </div>
              );
            })}
            {proximosCursos.length === 0 && (
              <div className="w-full text-center text-gray-500 py-8">
                <i className="ri-calendar-line text-3xl mb-2 block"></i>
                <p>{participantFilter ? 'No hay cursos próximos en este mes' : 'No hay cursos próximos'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Gráfica de Cursos por Mes */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <i className="ri-bar-chart-line text-green-600 mr-2"></i>
              Cursos por Mes
            </h3>
            <select 
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value)}
              className="border-gray-300 border rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1">Enero - Junio</option>
              <option value="2">Julio - Diciembre</option>
            </select>
          </div>
          <div className="h-64 flex items-end justify-between space-x-2 border-b border-l border-gray-200 pl-2 pb-2">
            {(() => {
              const semester = timeFrame;
              const startMonth = semester === '1' ? 0 : 6;
              const endMonth = semester === '1' ? 5 : 11;
              const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
              
              const monthData = [];
              for (let i = startMonth; i <= endMonth; i++) {
                const cursosEnMes = cursos.filter(curso => {
                  if (!curso.fechaInicio) return false;
                  const fecha = new Date(curso.fechaInicio);
                  return fecha.getMonth() === i;
                }).length;
                
                monthData.push({ month: monthNames[i], count: cursosEnMes });
              }
              
              const maxCount = Math.max(...monthData.map(d => d.count), 1);
              
              return monthData.map(data => {
                const height = maxCount === 0 ? 20 : Math.max((data.count / maxCount) * 200, 20);
                
                return (
                  <div key={data.month} className="flex-1 flex flex-col justify-end items-center h-full">
                    <div className="w-full flex flex-col justify-end items-center h-full">
                      <span className="text-xs font-semibold text-gray-700 mb-1">
                        {data.count}
                      </span>
                      <div className="w-full flex justify-center">
                        <div 
                          className="w-12 bg-green-600 rounded-t transition-all duration-500"
                          style={{height: `${height}px`}}
                        ></div>
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-xs font-medium text-gray-700">
                        {data.month}
                      </p>
                    </div>
                  </div>
                );
              });
            })()}
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
                    {Array.isArray(curso.participantes) ? curso.participantes.length : 0}
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