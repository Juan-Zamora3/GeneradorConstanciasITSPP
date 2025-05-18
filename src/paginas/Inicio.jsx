import React, { useEffect, useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexto/AuthContext'

export default function Inicio() {
  const navigate = useNavigate()
  const { usuario, logout } = useContext(AuthContext)
  const [user, setUser] = useState(null)
  const [timeFrame, setTimeFrame] = useState('2024-1')
  const [statsData, setStatsData] = useState({
    participantCount: 0,
    activeCourseCount: 0, 
    certificateCount: 0,
    averageAttendance: 0
  })

  useEffect(() => {
    if (!usuario) {
      navigate('/login', { replace: true })
    } else {
      setUser(usuario)
    }
  }, [usuario, navigate])

  const formatTrend = (value) => {
    return value >= 0 ? `+${value}%` : `${value}%`;
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  if (!user) return null

  return (
    <div className="p-6 space-y-6">
      {/* Tarjeta de bienvenida */}
      <div className="bg-white rounded-xl shadow p-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">¡Bienvenido, {user.name}!</h2>
          <p className="text-gray-600">({user.email})</p>
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
              +3
            </span>
            <span className="text-gray-400 text-sm">vs mes anterior</span>
          </div>
        </div>

        {/* Constancias Emitidas */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center">
              <i className="ri-file-list-3-line text-xl text-purple-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Constancias Emitidas</p>
              <h4 className="text-2xl font-semibold">{statsData.certificateCount}</h4>
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

        {/* Tasa de Asistencia */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center mb-4">
            <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center">
              <i className="ri-user-follow-line text-xl text-orange-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Tasa de Asistencia</p>
              <h4 className="text-2xl font-semibold">{statsData.averageAttendance}%</h4>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-green-600 flex items-center">
              <i className="ri-arrow-up-line mr-1"></i>
              {formatTrend(5)}
            </span>
            <span className="text-gray-400 text-sm">vs mes anterior</span>
          </div>
        </div>
      </div>

      {/* Sección de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Gráfico de asistencia por semestre */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Asistencias por Semestre</h3>
          <div className="h-60 flex items-center justify-center bg-gray-50 rounded">
            <div className="text-center text-gray-500">
              <i className="ri-bar-chart-2-line text-4xl mb-2"></i>
              <p>Los datos de asistencia se cargarán desde la base de datos</p>
            </div>
          </div>
        </div>
        
        {/* Gráfico de calificación de cursos */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Calificación de Cursos</h3>
          <div className="h-60 flex items-center justify-center bg-gray-50 rounded">
            <div className="text-center text-gray-500">
              <i className="ri-pie-chart-line text-4xl mb-2"></i>
              <p>Los datos de calificación se cargarán desde la base de datos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Próximos cursos */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Próximos Cursos</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de inicio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Los datos se cargarán desde la base de datos */}
              <tr>
                <td className="px-6 py-4 text-center text-gray-500" colSpan="4">
                  No hay cursos próximos para mostrar
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
        
        <div className="space-y-4">
          {/* Los datos de actividad se cargarán desde la base de datos */}
          <div className="text-center text-gray-500 py-4">
            No hay actividad reciente para mostrar
          </div>
        </div>
      </div>
    </div>
  )
}