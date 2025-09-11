import React, { useState } from 'react';
import ImageCarousel from '../common/ImageCarousel';
import QrCanvas from './QrCanvas';          // ← importa el componente

export default function DetailsModal({
  isOpen,
  onClose,
  data = {},
  type = 'course',
  onDelete,
}) {
  const [activeTab, setActiveTab] = useState('cuestionario');
  
  if (!isOpen) return null;
  
  // Verificar si es un curso de tipo grupo
  const isGroupCourse = data.tipoCurso === 'grupos';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg ${isGroupCourse ? 'max-w-4xl' : 'max-w-lg'} w-full p-6 space-y-4 overflow-y-auto max-h-full`}>
        <h3 className="text-xl font-semibold">
          {type === 'course' ? 'Detalles del Curso' : 'Detalles del Reporte'}
        </h3>

        {type === 'course' ? (
          <>
            {/* ── Datos del curso ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-2 text-sm">
              <p><strong>Título:</strong> {data.titulo}</p>
              <p><strong>Instructor:</strong> {data.instructor}</p>
              <p><strong>Fechas:</strong> {data.fechaInicio} – {data.fechaFin}</p>
              <p><strong>Ubicación:</strong> {data.ubicacion}</p>
              <p><strong>Categoría:</strong> {data.categoria}</p>
              <p><strong>Estado:</strong> {data.estado}</p>
              <p><strong>Tipo:</strong> {data.tipoCurso === 'grupos' ? 'Por Grupos' : 'Personal'}</p>
              <p><strong>Participantes:</strong> {data.lista?.length ?? 0}</p>
              <p><strong>Reportes:</strong> {data.reportes?.length ?? 0}</p>
              <p><strong>Descripción:</strong> {data.descripcion}</p>
            </div>

            {/* ── QR para registrar asistencia ────────────────────────────── */}
            <div className="pt-4 flex justify-center">
              <QrCanvas courseId={data.id} />
            </div>

            {/* ── Secciones específicas para cursos de grupo ─────────────── */}
            {isGroupCourse && (
              <div className="pt-6 border-t">
                {/* Pestañas */}
                <div className="flex border-b mb-4">
                  <button
                    onClick={() => setActiveTab('cuestionario')}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === 'cuestionario'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    📋 Información del Cuestionario
                  </button>
                  <button
                    onClick={() => setActiveTab('grupos')}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === 'grupos'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    👥 Grupos Registrados
                  </button>
                </div>

                {/* Contenido de las pestañas */}
                {activeTab === 'cuestionario' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Formulario de Registro de Grupos</h4>
                    
                    {/* Campos preestablecidos */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h5 className="font-medium text-blue-800 mb-3">Campos Preestablecidos</h5>
                      <div className="space-y-2 text-sm">
                        {data.formularioGrupos?.camposPreestablecidos?.nombreEquipo && (
                          <div className="flex items-center text-blue-700">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            Nombre del Equipo (requerido)
                          </div>
                        )}
                        {data.formularioGrupos?.camposPreestablecidos?.nombreLider && (
                          <div className="flex items-center text-blue-700">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            Nombre del Líder del Equipo (requerido)
                          </div>
                        )}
                        {data.formularioGrupos?.camposPreestablecidos?.contactoEquipo && (
                          <div className="flex items-center text-blue-700">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            Contacto del Equipo (requerido)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Preguntas personalizadas */}
                    {data.formularioGrupos?.preguntasPersonalizadas?.length > 0 && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h5 className="font-medium text-green-800 mb-3">Preguntas Personalizadas</h5>
                        <div className="space-y-3">
                          {data.formularioGrupos.preguntasPersonalizadas.map((pregunta, index) => (
                            <div key={index} className="bg-white p-3 rounded border border-green-200">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h6 className="font-medium text-gray-800">
                                    {pregunta.titulo}
                                    {pregunta.requerido && <span className="text-red-500 ml-1">*</span>}
                                  </h6>
                                  <p className="text-sm text-gray-600 capitalize">
                                    Tipo: {pregunta.tipo === 'abierta' ? 'Respuesta abierta' : 
                                           pregunta.tipo === 'combobox' ? 'Lista desplegable' :
                                           pregunta.tipo === 'multiple' ? 'Opción múltiple' : 'Lista de verificación'}
                                  </p>
                                  {pregunta.opciones?.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      {pregunta.opciones.length} opciones disponibles
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!data.formularioGrupos?.preguntasPersonalizadas || data.formularioGrupos.preguntasPersonalizadas.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No se han configurado preguntas personalizadas para este curso.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'grupos' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-semibold text-gray-800">Grupos Registrados</h4>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {data.grupos?.length || 0} grupos
                      </span>
                    </div>
                    
                    {data.grupos && data.grupos.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {data.grupos.map((grupo, index) => (
                          <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-800">{grupo.nombreEquipo || `Grupo ${index + 1}`}</h5>
                                <p className="text-sm text-gray-600 mt-1">
                                  <strong>Líder:</strong> {grupo.nombreLider || 'No especificado'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <strong>Contacto:</strong> {grupo.contactoEquipo || 'No especificado'}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                  Registrado: {grupo.fechaRegistro ? new Date(grupo.fechaRegistro).toLocaleDateString('es-MX') : 'Fecha no disponible'}
                                </p>
                              </div>
                              <div className="flex space-x-2 ml-4">
                                <button
                                  onClick={() => console.log('Ver grupo:', grupo)}
                                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                  title="Ver detalles"
                                >
                                  👁️
                                </button>
                                <button
                                  onClick={() => console.log('Editar grupo:', grupo)}
                                  className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                  title="Editar grupo"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm('¿Estás seguro de que quieres eliminar este grupo?')) {
                                      console.log('Eliminar grupo:', grupo);
                                    }
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                  title="Eliminar grupo"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-4">👥</div>
                        <p className="text-lg font-medium">No hay grupos registrados</p>
                        <p className="text-sm mt-2">Los grupos aparecerán aquí cuando se registren usando el código QR.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* ── Datos de reporte ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-2 text-sm">
              <p><strong>Título:</strong> {data.titulo}</p>
              <p><strong>Tipo:</strong> {data.tipo}</p>
              <p><strong>Fecha:</strong> {new Date(data.fecha).toLocaleDateString('es-MX')}</p>
              <p><strong>Descripción:</strong> {data.descripcion}</p>
            </div>

            {data.imagenes?.length > 0 && (
              <div className="pt-3">
                <ImageCarousel images={data.imagenes} />
              </div>
            )}
          </>
        )}

        {/* ── Botones ─────────────────────────────────────────────────────── */}
        <div className="flex justify-end gap-2 pt-4">
          {type === 'report' && onDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Eliminar
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
