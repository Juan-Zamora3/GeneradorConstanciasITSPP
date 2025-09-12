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
            {/* ── Layout con datos del curso y QR ─────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Datos del curso */}
              <div className="space-y-2 text-sm">
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

              {/* QR y Link de registro */}
              <div className="flex flex-col items-center space-y-4">
                <div className="text-center">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Código QR para registro</h4>
                  <QrCanvas courseId={data.id} />
                </div>
                
                {/* Link de registro con botón copiar */}
                <div className="w-full max-w-sm">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link de registro:
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={`${window.location.origin}/registro/${data.id}`}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/registro/${data.id}`);
                        // Aquí podrías agregar una notificación de éxito
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 text-sm"
                      title="Copiar link"
                    >
                      📋
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Secciones específicas para cursos de grupo ─────────────── */}
            {isGroupCourse && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                {/* Pestañas mejoradas */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
                  <button
                    onClick={() => setActiveTab('cuestionario')}
                    className={`flex-1 px-4 py-2 font-medium text-sm rounded-md transition-all duration-200 ${
                      activeTab === 'cuestionario'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    📋 Información del Cuestionario
                  </button>
                  <button
                    onClick={() => setActiveTab('grupos')}
                    className={`flex-1 px-4 py-2 font-medium text-sm rounded-md transition-all duration-200 ${
                      activeTab === 'grupos'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    👥 Grupos Registrados
                  </button>
                </div>

                {/* Contenido de las pestañas */}
                {activeTab === 'cuestionario' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h4 className="text-xl font-bold text-gray-800 mb-2">📋 Formulario de Registro de Grupos</h4>
                      <p className="text-gray-600 text-sm">Configuración del formulario que completarán los equipos</p>
                    </div>
                    
                    {/* Campos preestablecidos */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">✓</span>
                        </div>
                        <h5 className="text-lg font-semibold text-blue-800">Campos Preestablecidos</h5>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {data.formularioGrupos?.camposPreestablecidos?.nombreEquipo && (
                          <div className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                            <span className="text-blue-500 mr-3">🏷️</span>
                            <span className="text-gray-700 font-medium">Nombre del Equipo</span>
                            <span className="ml-auto text-red-500 text-sm">*</span>
                          </div>
                        )}
                        {data.formularioGrupos?.camposPreestablecidos?.nombreLider && (
                          <div className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                            <span className="text-blue-500 mr-3">👤</span>
                            <span className="text-gray-700 font-medium">Nombre del Líder</span>
                            <span className="ml-auto text-red-500 text-sm">*</span>
                          </div>
                        )}
                        {data.formularioGrupos?.camposPreestablecidos?.contactoEquipo && (
                          <div className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                            <span className="text-blue-500 mr-3">📞</span>
                            <span className="text-gray-700 font-medium">Contacto del Equipo</span>
                            <span className="ml-auto text-red-500 text-sm">*</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Preguntas personalizadas */}
                    {data.formularioGrupos?.preguntasPersonalizadas?.length > 0 ? (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                        <div className="flex items-center mb-4">
                          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-white text-sm font-bold">?</span>
                          </div>
                          <h5 className="text-lg font-semibold text-green-800">Preguntas Personalizadas</h5>
                        </div>
                        <div className="space-y-4">
                          {data.formularioGrupos.preguntasPersonalizadas.map((pregunta, index) => {
                            const tipoIconos = {
                              'abierta': '📝',
                              'combobox': '📋',
                              'multiple': '🔘',
                              'checkbox': '☑️'
                            };
                            const tipoTextos = {
                              'abierta': 'Respuesta abierta',
                              'combobox': 'Lista desplegable',
                              'multiple': 'Opción múltiple',
                              'checkbox': 'Lista de verificación'
                            };
                            return (
                              <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                                <div className="flex items-start space-x-3">
                                  <span className="text-xl">{tipoIconos[pregunta.tipo] || '❓'}</span>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <h6 className="font-semibold text-gray-800">
                                        {pregunta.titulo}
                                        {pregunta.requerido && <span className="text-red-500 ml-1">*</span>}
                                      </h6>
                                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                        {tipoTextos[pregunta.tipo] || 'Desconocido'}
                                      </span>
                                    </div>
                                    {pregunta.opciones?.length > 0 && (
                                      <div className="flex items-center text-sm text-gray-600">
                                        <span className="mr-2">📊</span>
                                        <span>{pregunta.opciones.length} opciones configuradas</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-8 rounded-xl border-2 border-dashed border-gray-200 text-center">
                        <div className="text-4xl mb-3">📝</div>
                        <h6 className="font-medium text-gray-700 mb-2">Sin preguntas personalizadas</h6>
                        <p className="text-gray-500 text-sm">No se han configurado preguntas adicionales para este curso.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'grupos' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h4 className="text-xl font-bold text-gray-800 mb-2">👥 Grupos Registrados</h4>
                      <div className="flex justify-center items-center space-x-2">
                        <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-full text-base font-semibold shadow-lg">
                          {data.grupos?.length || 0} {(data.grupos?.length || 0) === 1 ? 'grupo' : 'grupos'} registrados
                        </span>
                      </div>
                    </div>
                    
                    {data.grupos && data.grupos.length > 0 ? (
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {data.grupos.map((grupo, index) => (
                          <div key={index} className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center mb-3">
                                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                                    <span className="text-white font-bold text-sm">{index + 1}</span>
                                  </div>
                                  <h5 className="text-lg font-bold text-gray-800">{grupo.nombreEquipo || `Grupo ${index + 1}`}</h5>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                  <div className="flex items-center bg-blue-50 p-2 rounded-lg">
                                    <span className="text-blue-500 mr-2">👤</span>
                                    <div>
                                      <span className="text-xs text-blue-600 font-medium">Líder:</span>
                                      <p className="text-sm text-gray-700 font-medium">{grupo.nombreLider || 'No especificado'}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center bg-green-50 p-2 rounded-lg">
                                    <span className="text-green-500 mr-2">📞</span>
                                    <div>
                                      <span className="text-xs text-green-600 font-medium">Contacto:</span>
                                      <p className="text-sm text-gray-700 font-medium">{grupo.contactoEquipo || 'No especificado'}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center text-xs text-gray-500">
                                  <span className="mr-1">📅</span>
                                  <span>Registrado: {grupo.fechaRegistro ? new Date(grupo.fechaRegistro).toLocaleDateString('es-MX') : 'Fecha no disponible'}</span>
                                </div>
                              </div>
                              <div className="flex flex-col space-y-2 ml-4">
                                <button
                                  onClick={() => console.log('Ver grupo:', grupo)}
                                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-medium shadow-sm"
                                  title="Ver detalles"
                                >
                                  👁️ Ver
                                </button>
                                <button
                                  onClick={() => console.log('Editar grupo:', grupo)}
                                  className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs font-medium shadow-sm"
                                  title="Editar grupo"
                                >
                                  ✏️ Editar
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm('¿Estás seguro de que quieres eliminar este grupo?')) {
                                      console.log('Eliminar grupo:', grupo);
                                    }
                                  }}
                                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs font-medium shadow-sm"
                                  title="Eliminar grupo"
                                >
                                  🗑️ Eliminar
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-12 rounded-xl border-2 border-dashed border-gray-200 text-center">
                        <div className="text-6xl mb-4">👥</div>
                        <h6 className="text-lg font-semibold text-gray-700 mb-2">No hay grupos registrados</h6>
                        <p className="text-gray-500 text-sm mb-4">Los grupos aparecerán aquí cuando se registren usando el código QR o el link de registro.</p>
                        <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                          <span className="mr-2">💡</span>
                          Comparte el QR o link para que los equipos se registren
                        </div>
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
