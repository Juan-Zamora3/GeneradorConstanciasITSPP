import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../servicios/firebaseConfig';
import { MdGroups } from "react-icons/md";
import { IoMdArrowRoundBack } from "react-icons/io";
import itsppLogo from '../assets/logo.png';

export default function EquiposCurso() {
  const navigate = useNavigate()
  const { cursoId } = useParams()
  const [equipos, setEquipos] = useState([])
  const [equiposFiltrados, setEquiposFiltrados] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [curso, setCurso] = useState(null)

  const handleGoBack = () => {
    navigate('/cursos-cajero')
  }

  useEffect(() => {
    const fetchCursoYEquipos = async () => {
      try {
        setLoading(true)
        
        // Obtener información del curso
        const cursoDoc = await getDocs(query(collection(db, 'Cursos'), where('__name__', '==', cursoId)))
        
        if (!cursoDoc.empty) {
          const cursoData = cursoDoc.docs[0].data()
          setCurso({
            id: cursoDoc.docs[0].id,
            nombre: cursoData.cursoNombre || cursoData.titulo || 'Curso sin nombre',
            instructor: cursoData.asesor || cursoData.instructor || 'Sin instructor'
          })
        }

        // Buscar encuesta asociada al curso
        const encuestasQuery = query(collection(db, 'encuestas'), where('cursoId', '==', cursoId))
        const encuestasSnapshot = await getDocs(encuestasQuery)
        
        const equiposData = []
        
        // Para cada encuesta del curso, obtener las respuestas (equipos)
        for (const encuestaDoc of encuestasSnapshot.docs) {
          const respuestasRef = collection(encuestaDoc.ref, 'respuestas')
          const respuestasSnapshot = await getDocs(respuestasRef)
          
          respuestasSnapshot.forEach((respuestaDoc) => {
            const data = respuestaDoc.data()
            const preset = data.preset || {}
            
            equiposData.push({
              id: respuestaDoc.id,
              nombre: preset.nombreEquipo || 'Equipo sin nombre',
              lider: preset.nombreLider || 'Sin líder',
              contacto: preset.contactoEquipo || 'Sin contacto',
              categoria: preset.categoria || 'Sin categoría',
              integrantes: preset.integrantes || [],
              cantidadParticipantes: preset.cantidadParticipantes || preset.integrantes?.length || 0,
              fechaRegistro: data.submittedAt?.toDate() || data.createdAt || new Date(),
              estado: 'activo'
            })
          })
        }

        setEquipos(equiposData)
        setEquiposFiltrados(equiposData)
      } catch (error) {
        console.error('Error al obtener equipos:', error)
      } finally {
        setLoading(false)
      }
    }

    if (cursoId) {
      fetchCursoYEquipos()
    }
  }, [cursoId])

  useEffect(() => {
    const filtered = equipos.filter(equipo =>
      equipo.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setEquiposFiltrados(filtered)
  }, [searchTerm, equipos])

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
              <span className="font-medium">Volver a Cursos</span>
            </button>
            <div className="flex items-center space-x-4">
              <img src={itsppLogo} alt="ITSPP Logo" className="w-12 h-12" />
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  {curso ? `Equipos - ${curso.nombre}` : 'Equipos del Curso'}
                </h1>
                <p className="text-sm text-blue-700">Instituto Tecnológico Superior de Puerto Peñasco</p>
              </div>
            </div>
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Información del curso */}
        {curso && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{curso.nombre}</h2>
            <p className="text-gray-600">Instructor: {curso.instructor}</p>
          </div>
        )}

        {/* Barra de búsqueda */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Buscar equipo por nombre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Escribe el nombre del equipo..."
                />
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {equiposFiltrados.length} de {equipos.length} equipos
            </div>
          </div>
        </div>

        {/* Lista de equipos */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Equipos Registrados</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando equipos...</span>
            </div>
          ) : equiposFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm ? 'No se encontraron equipos' : 'No hay equipos registrados'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? `No hay equipos que coincidan con "${searchTerm}"`
                  : 'No se encontraron equipos registrados para este curso.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {equiposFiltrados.map((equipo) => (
                <div key={equipo.id} className="w-full bg-white shadow-[0px_0px_15px_rgba(0,0,0,0.09)] p-9 space-y-3 relative overflow-hidden rounded-lg">
                  <div className="w-24 h-24 bg-violet-500 rounded-full absolute -right-5 -top-7 flex items-center justify-center">
                    <span className="text-white text-lg font-bold">{equipo.cantidadParticipantes}</span>
                  </div>
                  <div className="fill-gray-400 w-12 h-12"> {/* Adjusted size */}
                    <MdGroups className="w-12 h-12 text-gray-500" />
                  </div>
                  <h1 className="font-bold text-xl text-gray-700">{equipo.nombre}</h1>
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-500">
                      <strong>Líder:</strong> {equipo.lider}
                    </p>
                    {equipo.categoria && (
                      <p className="text-sm text-zinc-500">
                        <strong>Categoría:</strong> {equipo.categoria}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(`/seleccionar-integrantes/${cursoId}/${equipo.id}`)}
                    className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium"
                  >
                    Generar Constancias
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}