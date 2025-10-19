import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../servicios/firebaseConfig';
import { MdGroups, MdPerson, MdCheck } from "react-icons/md";
import { IoMdArrowRoundBack } from "react-icons/io";

import { ArrowLeft, User, Check, Sparkles, Users, Crown, Star } from "lucide-react";
import itsppLogo from '../assets/logo.png';

export default function SeleccionarIntegrantes() {
  const navigate = useNavigate();
  const { cursoId, equipoId } = useParams();
  const [equipo, setEquipo] = useState(null);
  const [curso, setCurso] = useState(null);
  const [integrantes, setIntegrantes] = useState([]);
  const [integrantesSeleccionados, setIntegrantesSeleccionados] = useState([]);
  const [loading, setLoading] = useState(true);

  // Normaliza integrantes a { uid, nombre, email }
  const normalizeIntegrantes = (arr = []) =>
    arr.map((raw, index) => {
      if (typeof raw === 'string') {
        const nombre = raw.trim();
        return { uid: `${index}-${nombre || 'sin-nombre'}`, nombre: nombre || `Integrante ${index + 1}`, email: '' };
      }
      if (raw && typeof raw === 'object') {
        const nombre = raw.nombre || raw.name || raw.fullName || raw.miembro || raw.integrante || '';
        const email = raw.email || raw.correo || raw.contacto || '';
        const uid = raw.id || raw.uid || `${index}-${(nombre || 'sin-nombre')}`;
        return { uid, nombre: nombre || `Integrante ${index + 1}`, email };
      }
      return { uid: `${index}-sin-datos`, nombre: `Integrante ${index + 1}`, email: '' };
    });

  // Clave fiable para comparar selección
  const getIntegranteKey = (i) => (i?.uid ?? i?.nombre ?? String(i));

  const handleGoBack = () => {
    navigate(`/equipos-curso/${cursoId}`);
  };

  // Selección robusta por uid o nombre
  const toggleIntegrante = (integrante) => {
    const key = getIntegranteKey(integrante);
    setIntegrantesSeleccionados(prev => {
      const isSelected = prev.some(i => getIntegranteKey(i) === key);
      return isSelected
        ? prev.filter(i => getIntegranteKey(i) !== key)
        : [...prev, integrante];
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
        
        let equipoEncontrado = false;
        
        for (const encuestaDoc of encuestasSnapshot.docs) {
          const respuestasRef = collection(encuestaDoc.ref, 'respuestas');
          const respuestasSnapshot = await getDocs(respuestasRef);
          
          for (const respuestaDoc of respuestasSnapshot.docs) {
            if (respuestaDoc.id === equipoId) {
              const data = respuestaDoc.data();
              const preset = data.preset || {};
              const integrantesReales = preset.integrantes || [];
              const integrantesNormalizados = normalizeIntegrantes(integrantesReales);
              
              setEquipo({
                id: respuestaDoc.id,
                nombre: preset.nombreEquipo || 'Equipo sin nombre',
                lider: preset.nombreLider || 'Sin líder',
                categoria: preset.categoria || 'Sin categoría',
                integrantes: integrantesNormalizados
              });
              
              setIntegrantes(integrantesNormalizados);
              equipoEncontrado = true;
              break;
            }
          }
          
          if (equipoEncontrado) break;
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

  // Función para obtener el color basado en el índice
  const getColor = (index) => {
    const colors = [
      'from-blue-400 to-cyan-500',
      'from-indigo-400 to-blue-500',
      'from-green-400 to-emerald-500',
      'from-purple-400 to-indigo-500',
      'from-teal-400 to-cyan-500',
      'from-blue-500 to-cyan-600'
    ];
    return colors[index % colors.length];
  };

  // Función para obtener el ícono de rol
  const getRoleIcon = (nombre, lider) => {
    if (lider && nombre === lider) return <Crown className="w-4 h-4" />;
    return <Star className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-700 font-medium">Cargando información del equipo...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 relative overflow-hidden flex flex-col">
      {/* Fondo estático sin animaciones */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header 
        className="relative z-10 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg flex-shrink-0"
      >
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <button
                  onClick={handleGoBack}
                  className="border border-blue-200 text-blue-900 hover:bg-blue-50 bg-white/50 backdrop-blur-sm shadow-lg transition-all duration-300 p-3 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <div 
                  className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg"
                >
                  <img src={itsppLogo} alt="ITSPP Logo" className="w-8 h-8" />
                </div>
                <div>
                  <h1 
                    className="text-3xl bg-gradient-to-r from-blue-900 to-cyan-700 bg-clip-text text-transparent"
                  >
                    Seleccionar Participantes
                  </h1>
                  <p className="text-blue-600">
                    {curso?.nombre} • {equipo?.nombre}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Members List - Takes 3 columns */}
          <div className="lg:col-span-3 overflow-y-auto">
            {/* Encabezado */}
            <div className="mb-8">
              <div className="text-center">
                <h2 className="text-4xl bg-gradient-to-r from-blue-900 to-cyan-700 bg-clip-text text-transparent mb-4">
                  Integrantes del Equipo
                </h2>
                <p className="text-gray-600 text-lg">
                  Selecciona los participantes para quienes deseas generar constancias.
                </p>
              </div>
            </div>

            {/* Resumen de selección */}
            <div className="mb-4">
              <div className="p-6 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl border border-blue-200 shadow-lg">
                <div className="flex items-center justify-center space-x-3">
                  <Check className="w-6 h-6 text-blue-700" />
                  <p className="text-blue-800 text-lg font-medium">
                    {integrantesSeleccionados.length} de {integrantes.length} participantes seleccionados
                  </p>
                </div>
              </div>
            </div>

            {/* Botón Seleccionar Todos debajo del contador */}
            <div className="flex justify-end mb-4">
              <button
                onClick={seleccionarTodos}
                className="border border-blue-200 text-blue-900 hover:bg-blue-50 bg-white/80 backdrop-blur-sm shadow-lg px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>{integrantesSeleccionados.length === integrantes.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}</span>
              </button>
            </div>

            {/* Lista de integrantes */}
            {integrantes.length === 0 ? (
              <div className="text-center py-16">
                <User className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl text-gray-500 mb-3">No hay integrantes registrados</h3>
                <p className="text-gray-400 text-lg">Este equipo no tiene integrantes registrados.</p>
              </div>
            ) : (
              <div className="space-y-6 p-[10px]">
                {integrantes.map((integrante, index) => {
                  const isSelected = integrantesSeleccionados.some(i => getIntegranteKey(i) === getIntegranteKey(integrante));
                  const color = getColor(index);
                  return (
                    <div key={index}>
                      <div 
                        onClick={() => toggleIntegrante(integrante)}
                        className={`transition-all duration-300 rounded-xl overflow-hidden cursor-pointer ${
                          isSelected 
                            ? 'border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-xl transform scale-[1.02]' 
                            : 'border border-blue-100 hover:border-blue-200 hover:shadow-lg bg-white/80 backdrop-blur-sm'
                        }`}
                      >
                        <div className="p-6">
                          <div className="flex items-center space-x-6">
                            <div
                              className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                                isSelected 
                                  ? 'bg-blue-600 border-blue-600' 
                                  : 'border-gray-300'
                              }`}
                            >
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </div>
                            
                            <div className="flex-1 flex items-center justify-between">
                              {/* Basic Info */}
                              <div className="flex items-center space-x-4">
                                <div 
                                  className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white shadow-lg`}
                                >
                                  <User className="w-6 h-6" />
                                </div>
                                <div>
                                  <h3 className="text-xl text-gray-900 font-medium">{integrante.nombre || `Integrante ${index + 1}`}</h3>
                                  {integrante.email && (
                                    <p className="text-sm text-gray-600">{integrante.email}</p>
                                  )}
                                </div>
                              </div>

                              {/* Role Badge */}
                              <div>
                                <div 
                                  className={`${integrante.nombre === equipo?.lider 
                                    ? `bg-gradient-to-r ${color} text-white shadow-lg px-3 py-1 rounded-full` 
                                    : `border-2 bg-gradient-to-r ${color} bg-clip-text text-transparent border-blue-300 px-3 py-1 rounded-full`
                                  } text-sm font-medium flex items-center space-x-1`}
                                >
                                  {getRoleIcon(integrante.nombre, equipo?.lider)}
                                  <span className="ml-1">{integrante.nombre === equipo?.lider ? 'Líder del Equipo' : 'Integrante'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar - Action Panel */}
          <div 
            className="lg:col-span-1 flex flex-col justify-center"
          >
            <div className="bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-200 shadow-xl rounded-xl overflow-hidden">
              <div className="p-8 text-center">
                <Sparkles className="w-16 h-16 text-blue-600 mx-auto mb-6" />
                
                <h3 className="text-2xl text-blue-900 mb-3">
                  ¿Listos para continuar?
                </h3>
                
                <p className="text-gray-600 mb-8 text-lg">
                  Procederemos a generar las constancias para los {integrantesSeleccionados.length} participantes seleccionados.
                </p>
                  
                  <div>
                  <button
                    onClick={handleContinuar}
                    disabled={integrantesSeleccionados.length === 0}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-xl transition-all duration-300 w-full rounded-xl flex items-center justify-center"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Continuar con Constancias ({integrantesSeleccionados.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}