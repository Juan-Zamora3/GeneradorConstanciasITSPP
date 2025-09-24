import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';
import { IoMdArrowRoundBack } from "react-icons/io";
import { MdEdit, MdVisibility, MdPrint, MdPerson } from "react-icons/md";
import itsppLogo from '../assets/logo.png';

export default function EditarConstancias() {
  const navigate = useNavigate();
  const { cursoId, equipoId } = useParams();
  const location = useLocation();
  const { integrantesSeleccionados, equipo, curso } = location.state || {};

  const [constancias, setConstancias] = useState([]);
  const [constanciaActual, setConstanciaActual] = useState(0);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nombreEditado, setNombreEditado] = useState('');
  const [loading, setLoading] = useState(true);

  const handleGoBack = () => {
    navigate(`/seleccionar-integrantes/${cursoId}/${equipoId}`);
  };

  const handleEditarNombre = (index) => {
    setConstanciaActual(index);
    setNombreEditado(constancias[index].nombre);
    setEditandoNombre(true);
  };

  const handleGuardarNombre = () => {
    setConstancias(prev => prev.map((c, i) => 
      i === constanciaActual ? { ...c, nombre: nombreEditado } : c
    ));
    setEditandoNombre(false);
    setNombreEditado('');
  };

  const handleCancelarEdicion = () => {
    setEditandoNombre(false);
    setNombreEditado('');
  };

  const handleContinuar = () => {
    // Navegar a la pantalla de confirmación de pago
    navigate(`/confirmar-pago/${cursoId}/${equipoId}`, {
      state: { 
        constancias,
        equipo,
        curso
      }
    });
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    if (!integrantesSeleccionados || !equipo || !curso) {
      navigate(`/equipos-curso/${cursoId}`);
      return;
    }

    // Crear constancias para cada integrante seleccionado
    const constanciasData = integrantesSeleccionados.map((integrante, index) => ({
      id: `${equipoId}-${index}`,
      nombre: integrante.nombre || `Integrante ${index + 1}`,
      email: integrante.email || '',
      equipo: equipo.nombre,
      lider: equipo.lider,
      categoria: equipo.categoria,
      curso: curso.nombre,
      instructor: curso.instructor,
      fechaGeneracion: new Date(),
      mensaje: `Por su participación en "${curso.nombre}" como ${integrante.nombre === equipo.lider ? 'Líder' : 'Integrante'} del equipo "${equipo.nombre}".`
    }));

    setConstancias(constanciasData);
    setLoading(false);
  }, [integrantesSeleccionados, equipo, curso, cursoId, equipoId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-700 font-medium">Preparando constancias...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <button
              onClick={handleGoBack}
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200 group"
            >
              <IoMdArrowRoundBack className="w-6 h-6 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="font-medium">Volver a Selección</span>
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Editar Constancias</h1>
              <p className="text-sm text-gray-600 mt-1">
                {curso?.nombre} • {equipo?.nombre}
              </p>
            </div>
            <div className="w-32"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de constancias */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
                <h3 className="text-xl font-bold text-white">Constancias a Generar</h3>
                <p className="text-blue-100 text-sm">{constancias.length} constancia(s)</p>
              </div>
              
              <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                {constancias.map((constancia, index) => (
                  <div
                    key={constancia.id}
                    onClick={() => setConstanciaActual(index)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      constanciaActual === index
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`rounded-full p-2 ${
                        constanciaActual === index ? 'bg-blue-500' : 'bg-gray-100'
                      }`}>
                        <MdPerson className={`w-5 h-5 ${
                          constanciaActual === index ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold ${
                          constanciaActual === index ? 'text-blue-800' : 'text-gray-900'
                        }`}>
                          {constancia.nombre}
                        </h4>
                        <p className={`text-sm ${
                          constanciaActual === index ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                          {constancia.nombre === equipo?.lider ? 'Líder' : 'Integrante'}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditarNombre(index);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <MdEdit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Previsualización de constancia */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Previsualización</h3>
                    <p className="text-green-100 text-sm">
                      {constancias[constanciaActual]?.nombre || 'Selecciona una constancia'}
                    </p>
                  </div>
                  <MdVisibility className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="p-8">
                {constancias.length > 0 && (
                  <div className="bg-gray-50 rounded-2xl p-8 border-2 border-dashed border-gray-300">
                    {/* Simulación de constancia */}
                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
                      {/* Header con logo */}
                      <div className="text-center mb-8">
                        <img src={itsppLogo} alt="ITSPP Logo" className="w-24 h-24 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                          INSTITUTO TECNOLÓGICO SUPERIOR
                        </h1>
                        <h2 className="text-xl font-bold text-blue-700 mb-4">
                          DE PUERTO PEÑASCO
                        </h2>
                        <div className="w-32 h-1 bg-gradient-to-r from-blue-600 to-green-600 mx-auto"></div>
                      </div>

                      {/* Contenido de la constancia */}
                      <div className="text-center space-y-6">
                        <h3 className="text-3xl font-bold text-gray-900 mb-6">
                          CONSTANCIA DE PARTICIPACIÓN
                        </h3>
                        
                        <div className="space-y-4">
                          <p className="text-lg text-gray-700">Se otorga la presente constancia a:</p>
                          
                          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                            <h4 className="text-2xl font-bold text-blue-800">
                              {constancias[constanciaActual]?.nombre || 'NOMBRE DEL PARTICIPANTE'}
                            </h4>
                          </div>
                          
                          <div className="space-y-2 text-gray-700">
                            <p className="text-lg">
                              {constancias[constanciaActual]?.mensaje || 'Mensaje de la constancia'}
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-sm">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p><strong>Equipo:</strong> {constancias[constanciaActual]?.equipo}</p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p><strong>Categoría:</strong> {constancias[constanciaActual]?.categoria}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-8 pt-6 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                              Fecha de expedición: {formatearFecha(constancias[constanciaActual]?.fechaGeneracion)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Botón continuar */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleContinuar}
            className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:from-green-700 hover:to-emerald-800 transition-all duration-200 transform hover:scale-105 shadow-xl"
          >
            <div className="flex items-center space-x-3">
              <MdPrint className="w-6 h-6" />
              <span>Continuar con el Pago</span>
            </div>
          </button>
        </div>
      </div>

      {/* Modal de edición de nombre */}
      {editandoNombre && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Editar Nombre
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del participante
                </label>
                <input
                  type="text"
                  value={nombreEditado}
                  onChange={(e) => setNombreEditado(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Ingresa el nombre completo"
                  autoFocus
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleCancelarEdicion}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardarNombre}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 font-medium"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}