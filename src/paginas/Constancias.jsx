import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexto/AuthContext'

export default function Constancias() {
  const navigate = useNavigate()
  const { usuario } = useContext(AuthContext)
  const [constancias, setConstancias] = useState([
    // Los datos de constancias vendrán de la base de datos
  ])
  const [cursos, setCursos] = useState([])
  const [participantes, setParticipantes] = useState([])
  const [cursoSeleccionado, setCursoSeleccionado] = useState('')
  const [loading, setLoading] = useState(false)
  const [guardandoAsistencia, setGuardandoAsistencia] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [constanciaPreview, setConstanciaPreview] = useState(null)
  const [asistencias, setAsistencias] = useState([])

  useEffect(() => {
    if (!usuario) {
      navigate('/login', { replace: true })
    } else {
      // Aquí se cargarían los datos desde la base de datos
      setLoading(true)
      // Simulamos carga
      setTimeout(() => {
        setLoading(false)
      }, 500)
    }
  }, [usuario, navigate])

  // Se actualiza cuando se selecciona un curso
  useEffect(() => {
    if (cursoSeleccionado) {
      // Aquí se cargarían los participantes del curso desde la base de datos
      setLoading(true)
      setTimeout(() => {
        setLoading(false)
        // Reiniciamos asistencias
        setAsistencias([])
      }, 300)
    }
  }, [cursoSeleccionado])

  const handleAsistenciaCheck = (participanteId) => {
    if (asistencias.includes(participanteId)) {
      setAsistencias(asistencias.filter(id => id !== participanteId))
    } else {
      setAsistencias([...asistencias, participanteId])
    }
  }

  const handleSelectAllAsistencias = () => {
    if (asistencias.length === participantes.length) {
      setAsistencias([])
    } else {
      setAsistencias(participantes.map(p => p.id))
    }
  }
  
  const handleGuardarAsistencias = () => {
    if (!cursoSeleccionado) {
      alert('Por favor selecciona un curso')
      return
    }
    
    setGuardandoAsistencia(true)
    
    // Aquí se guardarían las asistencias en la base de datos
    setTimeout(() => {
      setGuardandoAsistencia(false)
      alert('Asistencias guardadas correctamente')
    }, 1000)
  }

  const handleGenerarConstancia = () => {
    if (!cursoSeleccionado) {
      alert('Por favor selecciona un curso')
      return
    }

    if (asistencias.length === 0) {
      alert('Por favor marca la asistencia de al menos un participante')
      return
    }

    setGenerando(true)
    // Simulamos la generación
    setTimeout(() => {
      setGenerando(false)
      // Aquí se generaría la constancia y se mostraría
      const nuevaConstancia = {
        id: Date.now(),
        curso: cursos.find(c => c.id === parseInt(cursoSeleccionado))?.titulo || 'Curso Seleccionado',
        participante: asistencias.length === 1
          ? participantes.find(p => p.id === asistencias[0])?.nombre + ' ' +
            participantes.find(p => p.id === asistencias[0])?.apellidos
          : `${asistencias.length} participantes con asistencia`,
        fecha: new Date(),
        folio: `CERT-${Math.floor(1000 + Math.random() * 9000)}`
      }
      
      setConstanciaPreview(nuevaConstancia)
      
      // Agregamos al historial
      setConstancias([nuevaConstancia, ...constancias])
    }, 1500)
  }

  const handleDescargarPDF = () => {
    // Aquí iría la lógica para descargar el PDF
    alert('Descargando PDF...')
  }

  const handleExportarExcel = () => {
    // Aquí iría la lógica para exportar a Excel
    alert('Exportando a Excel...')
  }

  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  if (!usuario) return null

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Generación de Constancias</h2>
      
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Seleccionar curso y registrar asistencia</h3>
        
        {/* Selector de curso */}
        <div className="max-w-md mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
          <select
            value={cursoSeleccionado}
            onChange={(e) => setCursoSeleccionado(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            <option value="">Seleccionar curso</option>
            {cursos.map(curso => (
              <option key={curso.id} value={curso.id}>
                {curso.titulo}
              </option>
            ))}
          </select>
          {cursos.length === 0 && !loading && (
            <p className="mt-1 text-sm text-red-500">
              No hay cursos disponibles. Crea un curso primero.
            </p>
          )}
        </div>
        
        {/* Lista de participantes con checkboxes de asistencia */}
        {cursoSeleccionado && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Registro de asistencia</h4>
              {participantes.length > 0 && (
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={handleSelectAllAsistencias}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {asistencias.length === participantes.length 
                      ? 'Desmarcar todos' 
                      : 'Marcar todos como presentes'}
                  </button>
                  
                  <button
                    onClick={handleGuardarAsistencias}
                    disabled={guardandoAsistencia}
                    className={`px-3 py-1.5 text-sm rounded ${
                      guardandoAsistencia 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white`}
                  >
                    {guardandoAsistencia ? (
                      <>
                        <i className="ri-loader-2-line animate-spin mr-1"></i>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <i className="ri-save-line mr-1"></i>
                        Guardar asistencia
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
            
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : participantes.length === 0 ? (
              <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500">No hay participantes inscritos en este curso</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asistencia</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Área</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {participantes.map(participante => (
                      <tr key={participante.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={asistencias.includes(participante.id)}
                            onChange={() => handleAsistenciaCheck(participante.id)}
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {participante.nombre} {participante.apellidos}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{participante.area}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {cursoSeleccionado && participantes.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleGenerarConstancia}
              disabled={!cursoSeleccionado || asistencias.length === 0 || generando}
              className={`px-4 py-2 rounded text-white ${
                (!cursoSeleccionado || asistencias.length === 0 || generando) 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } transition`}
            >
              {generando ? (
                <>
                  <i className="ri-loader-2-line animate-spin mr-2"></i>
                  Generando...
                </>
              ) : (
                <>
                  <i className="ri-file-pdf-line mr-2"></i>
                  Generar Constancias
                </>
              )}
            </button>
            <p className="text-sm text-gray-500 italic self-center">
              * Se generarán constancias solo para participantes con asistencia marcada
            </p>
          </div>
        )}
      </div>
      
      {/* Vista previa de la constancia */}
      {constanciaPreview && (
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Vista previa de constancia</h3>
          
          <div className="border border-gray-200 rounded-lg p-6 relative overflow-hidden bg-gray-50">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">CONSTANCIA DE PARTICIPACIÓN</h2>
              <p className="text-sm text-gray-500">Instituto Tecnológico Superior de Puerto Peñasco</p>
            </div>
            
            <div className="text-center mb-8">
              <p className="text-base text-gray-700 leading-relaxed">
                Se otorga la presente constancia a:
              </p>
              <p className="text-xl font-bold text-gray-800 mt-2 mb-6">{constanciaPreview.participante}</p>
              
              <p className="text-base text-gray-700 leading-relaxed">
                Por su participación en el curso:
              </p>
              <p className="text-xl font-bold text-gray-800 mt-2">{constanciaPreview.curso}</p>
            </div>
            
            <div className="text-center mb-8">
              <p className="text-sm text-gray-600">
                Puerto Peñasco, Sonora a {formatDate(new Date())}
              </p>
            </div>
            
            <div className="flex justify-between items-center pt-4 mt-8 border-t border-dashed border-gray-300">
              <div className="text-xs text-gray-500">
                Folio: {constanciaPreview.folio}
              </div>
              <div className="text-xs text-gray-500">
                Esta constancia puede ser verificada en el sistema institucional
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              onClick={() => setConstanciaPreview(null)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cerrar
            </button>
            <button 
              onClick={handleExportarExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <i className="ri-file-excel-2-line mr-2"></i>
              Exportar Excel
            </button>
            <button 
              onClick={handleDescargarPDF}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              <i className="ri-download-line mr-2"></i>
              Descargar PDF
            </button>
          </div>
        </div>
      )}
      
      {/* Historial de constancias */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Historial de constancias generadas</h3>
          <button
            onClick={handleExportarExcel}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
          >
            <i className="ri-file-excel-2-line mr-2"></i>
            Exportar historial
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Folio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Curso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participante</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {constancias.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No hay constancias generadas aún
                  </td>
                </tr>
              ) : (
                constancias.map(constancia => (
                  <tr key={constancia.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{constancia.folio}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{constancia.curso}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{constancia.participante}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(constancia.fecha)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <button className="text-blue-600 hover:text-blue-800" title="Ver">
                        <i className="ri-eye-line"></i>
                      </button>
                      <button className="text-green-600 hover:text-green-800" title="Exportar Excel">
                        <i className="ri-file-excel-2-line"></i>
                      </button>
                      <button className="text-red-600 hover:text-red-800" title="Descargar PDF">
                        <i className="ri-file-pdf-line"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}