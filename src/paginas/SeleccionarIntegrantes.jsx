import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../servicios/firebaseConfig';
import { MdGroups, MdPerson, MdCheck } from "react-icons/md";
import { IoMdArrowRoundBack } from "react-icons/io";

export default function SeleccionarIntegrantes() {
  const navigate = useNavigate();
  const { cursoId, equipoId } = useParams();
  const [equipo, setEquipo] = useState(null);
  const [curso, setCurso] = useState(null);
  const [integrantes, setIntegrantes] = useState([]);
  const [integrantesSeleccionados, setIntegrantesSeleccionados] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleGoBack = () => {
    navigate(`/equipos-curso/${cursoId}`);
  };

  const toggleIntegrante = (integrante) => {
    setIntegrantesSeleccionados(prev => {
      const isSelected = prev.some(i => i.nombre === integrante.nombre);
      if (isSelected) {
        return prev.filter(i => i.nombre !== integrante.nombre);
      } else {
        return [...prev, integrante];
      }
    });
  };

  const seleccionarTodos = () => {
    if (integrantesSeleccionados.length === integrantes.length) {
      setIntegrantesSeleccionados([]);
    } else {
      setIntegrantesSeleccionados([...integrantes]);
    }
  };

  const handleContinuar = () => {
    if (integrantesSeleccionados.length === 0) {
      alert('Por favor selecciona al menos un integrante');
      return;
    }
    
    // Navegar a la pantalla de edición de constancias
    navigate(`/editar-constancias/${cursoId}/${equipoId}`, {
      state: { 
        integrantesSeleccionados,
        equipo,
        curso
      }
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener información del curso
        const cursoDoc = await getDocs(query(collection(db, 'Cursos'), where('__name__', '==', cursoId)));
        if (!cursoDoc.empty) {
          const cursoData = cursoDoc.docs[0].data();
          setCurso({
            id: cursoDoc.docs[0].id,
            nombre: cursoData.cursoNombre || cursoData.titulo || 'Curso sin nombre',
            instructor: cursoData.asesor || cursoData.instructor || 'Sin instructor'
          });
        }

        // Buscar el equipo específico
        const encuestasQuery = query(collection(db, 'encuestas'), where('cursoId', '==', cursoId));
        const encuestasSnapshot = await getDocs(encuestasQuery);
        
        for (const encuestaDoc of encuestasSnapshot.docs) {
          const respuestasRef = collection(encuestaDoc.ref, 'respuestas');
          const respuestasSnapshot = await getDocs(respuestasRef);
          
          for (const respuestaDoc of respuestasSnapshot.docs) {
            if (respuestaDoc.id === equipoId) {
              const data = respuestaDoc.data();
              const preset = data.preset || {};
              
              setEquipo({
                id: respuestaDoc.id,
                nombre: preset.nombreEquipo || 'Equipo sin nombre',
                lider: preset.nombreLider || 'Sin líder',
                categoria: preset.categoria || 'Sin categoría',
                integrantes: preset.integrantes || []
              });
              
              setIntegrantes(preset.integrantes || []);
              break;
            }
          }
        }
      } catch (error) {
        console.error('Error al obtener datos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (cursoId && equipoId) {
      fetchData();
    }
  }, [cursoId, equipoId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-700 font-medium">Cargando información del equipo...</span>
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
              <span className="font-medium">Volver a Equipos</span>
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Seleccionar Integrantes</h1>
              <p className="text-sm text-gray-600 mt-1">
                {curso?.nombre} • {equipo?.nombre}
              </p>
            </div>
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Información del equipo */}
        {equipo && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <div className="flex items-center space-x-6">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4">
                <MdGroups className="w-12 h-12 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{equipo.nombre}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
                  <p><span className="font-semibold text-gray-800">Líder:</span> {equipo.lider}</p>
                  <p><span className="font-semibold text-gray-800">Categoría:</span> {equipo.categoria}</p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-full w-16 h-16 flex items-center justify-center mb-2">
                  <span className="text-white text-xl font-bold">{integrantes.length}</span>
                </div>
                <p className="text-sm text-gray-600 font-medium">Integrantes</p>
              </div>
            </div>
          </div>
        )}

        {/* Selección de integrantes */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Seleccionar Integrantes</h3>
                <p className="text-blue-100">Elige los integrantes para generar sus constancias</p>
              </div>
              <button
                onClick={seleccionarTodos}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium"
              >
                {integrantesSeleccionados.length === integrantes.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
              </button>
            </div>
          </div>

          <div className="p-8">
            {integrantes.length === 0 ? (
              <div className="text-center py-12">
                <MdPerson className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay integrantes registrados</h3>
                <p className="text-gray-500">Este equipo no tiene integrantes registrados.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {integrantes.map((integrante, index) => {
                    const isSelected = integrantesSeleccionados.some(i => i.nombre === integrante.nombre);
                    return (
                      <div
                        key={index}
                        onClick={() => toggleIntegrante(integrante)}
                        className={`relative cursor-pointer rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                          isSelected 
                            ? 'border-green-500 bg-green-50 shadow-lg' 
                            : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className={`rounded-full p-3 ${isSelected ? 'bg-green-500' : 'bg-gray-100'}`}>
                              <MdPerson className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                            </div>
                            {isSelected && (
                              <div className="bg-green-500 rounded-full p-1">
                                <MdCheck className="w-5 h-5 text-white" />
                              </div>
                            )}
                          </div>
                          <h4 className={`font-bold text-lg mb-2 ${isSelected ? 'text-green-800' : 'text-gray-900'}`}>
                            {integrante.nombre || `Integrante ${index + 1}`}
                          </h4>
                          {integrante.email && (
                            <p className={`text-sm ${isSelected ? 'text-green-600' : 'text-gray-600'}`}>
                              {integrante.email}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Resumen de selección */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-1">
                        {integrantesSeleccionados.length} integrante(s) seleccionado(s)
                      </h4>
                      <p className="text-gray-600">
                        {integrantesSeleccionados.length === 0 
                          ? 'Selecciona al menos un integrante para continuar'
                          : `Se generarán ${integrantesSeleccionados.length} constancia(s)`
                        }
                      </p>
                    </div>
                    <button
                      onClick={handleContinuar}
                      disabled={integrantesSeleccionados.length === 0}
                      className={`px-8 py-3 rounded-xl font-bold transition-all duration-200 ${
                        integrantesSeleccionados.length === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800 transform hover:scale-105 shadow-lg'
                      }`}
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}