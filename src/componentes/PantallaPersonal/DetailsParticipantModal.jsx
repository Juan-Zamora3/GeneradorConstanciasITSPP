import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie } from 'react-chartjs-2'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../servicios/firebaseConfig'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function DetailsParticipantModal({
  isOpen,
  participant,
  onClose
}) {
  const [cursosData, setCursosData] = useState({
    asistidos: [],
    noAsistidos: [],
    loading: true
  })

  useEffect(() => {
    if (!isOpen || !participant) return

    const fetchCursosData = async () => {
      try {
        setCursosData(prev => ({ ...prev, loading: true }))

        // Obtener todos los cursos
        const cursosRef = collection(db, 'Cursos')
        const cursosSnapshot = await getDocs(cursosRef)
        const todosCursos = cursosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        // Separar cursos donde el participante asistió vs no asistió
        const asistidos = []
        const noAsistidos = []

        for (const curso of todosCursos) {
          // Verificar en el array 'listas' - puede ser un array de arrays o un array simple
          const listas = curso.listas || []
          let participantesIds = []

          if (Array.isArray(listas)) {
            // Si listas es un array de arrays, tomar el primer array
            if (listas.length > 0 && Array.isArray(listas[0])) {
              participantesIds = listas[0]
            } else {
              // Si es un array simple de IDs
              participantesIds = listas
            }
          }

          // SOLO procesar cursos donde el participante está en la lista inicial
          const estaEnLista = participantesIds.includes(participant.id)

          if (!estaEnLista) {
            continue // Saltar este curso si el participante no está en la lista
          }

          const cursoConNombre = {
            ...curso,
            nombre: curso.cursoNombre || curso.titulo || 'Sin nombre'
          }

          // Verificar si realmente asistió consultando colección Asistencias
          const asisSnap = await getDocs(
            query(
              collection(db, 'Asistencias'),
              where('cursoId', '==', curso.id),
              where('personalId', '==', participant.id)
            )
          )
          const yaAsistio = !asisSnap.empty

          if (yaAsistio) {
            asistidos.push(cursoConNombre)
          } else {
            noAsistidos.push(cursoConNombre)
          }
        }

        setCursosData({
          asistidos,
          noAsistidos,
          loading: false
        })
      } catch (error) {
        console.error('Error fetching courses data:', error)
        setCursosData({
          asistidos: [],
          noAsistidos: [],
          loading: false
        })
      }
    }

    fetchCursosData()
  }, [isOpen, participant])

  if (!isOpen || !participant) return null

  const initials = (n, a) =>
    n.charAt(0) + (a ? a.charAt(0) : '')

  const color = id => {
    const cols = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-yellow-100 text-yellow-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800'
    ]
    const sum = [...id].reduce((s, c) => s + c.charCodeAt(0), 0)
    return cols[sum % cols.length]
  }

  // Datos para la gráfica de pastel
  const chartData = {
    labels: ['Cursos Asistidos', 'Cursos No Asistidos'],
    datasets: [
      {
        data: [cursosData.asistidos.length, cursosData.noAsistidos.length],
        backgroundColor: [
          '#10B981', // Verde para asistidos
          '#EF4444'  // Rojo para no asistidos
        ],
        borderColor: [
          '#059669',
          '#DC2626'
        ],
        borderWidth: 2,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0
            return `${context.label}: ${context.parsed} (${percentage}%)`
          }
        }
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Detalles del Participante</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          {/* Información del participante */}
          <div className="flex items-center mb-6">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg ${color(participant.id)}`}
            >
              {initials(participant.nombre, participant.apellidos)}
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-semibold">
                {participant.nombre} {participant.apellidos}
              </h4>
              <p className="text-gray-600">{participant.area}</p>
            </div>
          </div>

          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <strong>Correo:</strong> {participant.correo}
              </div>
              {participant.telefono && (
                <div>
                  <strong>Teléfono:</strong> {participant.telefono}
                </div>
              )}
              <div>
                <strong>Área/Puesto:</strong> {participant.area}
              </div>
            </div>

            {/* Gráfica de pastel */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="text-lg font-medium mb-4 text-center">Participación en Cursos</h5>
              {cursosData.loading ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="h-48">
                  <Pie data={chartData} options={chartOptions} />
                </div>
              )}
            </div>
          </div>

          {/* Listas de cursos */}
          {!cursosData.loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cursos asistidos */}
              <div>
                <h5 className="text-lg font-medium mb-3 text-green-700 flex items-center">
                  <i className="ri-checkbox-circle-line mr-2"></i>
                  Cursos Asistidos ({cursosData.asistidos.length})
                </h5>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {cursosData.asistidos.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">No ha asistido a ningún curso</p>
                  ) : (
                    cursosData.asistidos.map(curso => (
                      <div key={curso.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <h6 className="font-medium text-green-800">{curso.nombre}</h6>
                        <p className="text-sm text-green-600">
                          {curso.fechaInicio && new Date(curso.fechaInicio).toLocaleDateString()}
                        </p>
                        {curso.estado && (
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                            curso.estado === 'completado' ? 'bg-green-100 text-green-800' :
                            curso.estado === 'en_curso' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {curso.estado === 'completado' ? 'Completado' :
                             curso.estado === 'en_curso' ? 'En Curso' : 'Próximo'}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Cursos no asistidos */}
              <div>
                <h5 className="text-lg font-medium mb-3 text-red-700 flex items-center">
                  <i className="ri-close-circle-line mr-2"></i>
                  Cursos No Asistidos ({cursosData.noAsistidos.length})
                </h5>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {cursosData.noAsistidos.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">Ha asistido a todos los cursos disponibles</p>
                  ) : (
                    cursosData.noAsistidos.map(curso => (
                      <div key={curso.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <h6 className="font-medium text-red-800">{curso.nombre}</h6>
                        <p className="text-sm text-red-600">
                          {curso.fechaInicio && new Date(curso.fechaInicio).toLocaleDateString()}
                        </p>
                        {curso.estado && (
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                            curso.estado === 'completado' ? 'bg-gray-100 text-gray-800' :
                            curso.estado === 'en_curso' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {curso.estado === 'completado' ? 'Completado' :
                             curso.estado === 'en_curso' ? 'En Curso' : 'Próximo'}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-6 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

DetailsParticipantModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  participant: PropTypes.object,
  onClose: PropTypes.func.isRequired
}