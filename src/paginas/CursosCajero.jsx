import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../servicios/firebaseConfig'
import { IoMdArrowRoundBack } from "react-icons/io"
import { MdSchool } from "react-icons/md"
import itsppLogo from '../assets/logo.png'

export default function CursosCajero() {
  const navigate = useNavigate()
  const [cursosActivos, setCursosActivos] = useState([])
  const [loading, setLoading] = useState(true)

  const handleGoBack = () => {
    navigate('/pantalla-cajero')
  }

  // Cargar cursos desde Firebase
  useEffect(() => {
    const cursosRef = collection(db, 'Cursos')
    const q = query(cursosRef, orderBy('fechaInicio', 'asc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0) // Establecer a medianoche para comparación de fechas

      const cursosData = snapshot.docs
        .map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            nombre: data.cursoNombre || 'Sin título',
            instructor: data.asesor || 'Sin instructor',
            participantes: Array.isArray(data.listas) ? data.listas.length : 0,
            fechaInicio: data.fechaInicio || '',
            fechaFin: data.fechaFin || '',
            estado: data.estado || 'proximo',
            categoria: data.categoria || '',
            descripcion: data.descripcion || '',
            ubicacion: data.ubicacion || '',
            imagen: data.imageUrl || ''
          }
        })
        .filter(curso => {
          // Filtrar solo cursos activos (fecha fin no ha llegado)
          if (!curso.fechaFin) return false
          
          const fechaFin = new Date(curso.fechaFin)
          fechaFin.setHours(23, 59, 59, 999) // Establecer al final del día
          
          return fechaFin >= hoy
        })

      setCursosActivos(cursosData)
      setLoading(false)
    }, (error) => {
      console.error('Error al cargar cursos:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Calcular progreso basado en fechas
  const calcularProgreso = (fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin) return 0
    
    const inicio = new Date(fechaInicio)
    const fin = new Date(fechaFin)
    const hoy = new Date()
    
    if (hoy < inicio) return 0 // Curso no ha comenzado
    if (hoy > fin) return 100 // Curso terminado
    
    const duracionTotal = fin - inicio
    const tiempoTranscurrido = hoy - inicio
    
    return Math.round((tiempoTranscurrido / duracionTotal) * 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-green-50">
      {/* Header institucional */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <button
              onClick={handleGoBack}
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200 group"
            >
              <IoMdArrowRoundBack className="w-6 h-6 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="font-medium">Volver al Inicio</span>
            </button>
            <div className="flex items-center space-x-4">
              <img src={itsppLogo} alt="ITSPP Logo" className="w-12 h-12" />
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">Cursos Activos</h1>
                <p className="text-sm text-blue-700">Instituto Tecnológico Superior de Puerto Peñasco</p>
              </div>
            </div>
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">



        {/* Lista de cursos en cards */}
        <div className="mb-8">
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando cursos...</span>
            </div>
          ) : cursosActivos.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay cursos activos</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron cursos con fecha de finalización pendiente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cursosActivos.map((curso) => {
                return (
                  <div key={curso.id} className="relative flex w-full flex-col rounded-xl bg-white bg-clip-border text-gray-700 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="relative mx-4 -mt-6 h-40 overflow-hidden rounded-xl bg-clip-border shadow-lg bg-gradient-to-r from-blue-500 to-blue-600">
                      {curso.imagen ? (
                        <img 
                          src={curso.imagen} 
                          alt={curso.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                          <svg className="w-16 h-16 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h5 className="mb-3 block font-sans text-xl font-semibold leading-snug tracking-normal text-blue-gray-900 antialiased">
                        {curso.nombre}
                      </h5>
                      <p className="text-sm text-gray-600 mb-4">
                        <strong>Instructor:</strong> {curso.instructor}
                      </p>
                    </div>
                    <div className="p-6 pt-0">
                      <button 
                        onClick={() => navigate(`/equipos-curso/${curso.id}`)}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
                      >
                        Ver Equipos
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}