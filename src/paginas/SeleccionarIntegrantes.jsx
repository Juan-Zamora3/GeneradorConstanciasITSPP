import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../servicios/firebaseConfig';
import { MdGroups, MdPerson, MdCheck } from "react-icons/md";
import { IoMdArrowRoundBack } from "react-icons/io";
import { motion } from "framer-motion";
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
        
        let equipoEncontrado = false;
        
        for (const encuestaDoc of encuestasSnapshot.docs) {
          const respuestasRef = collection(encuestaDoc.ref, 'respuestas');
          const respuestasSnapshot = await getDocs(respuestasRef);
          
          for (const respuestaDoc of respuestasSnapshot.docs) {
            if (respuestaDoc.id === equipoId) {
              const data = respuestaDoc.data();
              const preset = data.preset || {};
              
              // Obtener los integrantes reales del equipo desde la base de datos
              const integrantesReales = preset.integrantes || [];
              
              setEquipo({
                id: respuestaDoc.id,
                nombre: preset.nombreEquipo || 'Equipo sin nombre',
                lider: preset.nombreLider || 'Sin líder',
                categoria: preset.categoria || 'Sin categoría',
                integrantes: integrantesReales
              });
              
              // Establecer los integrantes reales
              setIntegrantes(integrantesReales);
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
      'from-yellow-400 to-orange-500',
      'from-blue-400 to-cyan-500',
      'from-green-400 to-emerald-500',
      'from-purple-400 to-violet-500',
      'from-red-400 to-pink-500',
      'from-teal-400 to-cyan-500'
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
      <div className="h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50 flex items-center justify-center">
        <motion.div 
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 flex items-center space-x-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <span className="text-gray-700 font-medium">Cargando información del equipo...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50 relative overflow-hidden flex flex-col">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-400/10 to-red-400/10 rounded-full blur-3xl"
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.4, 1]
          }}
          transition={{ 
            duration: 18, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-full blur-3xl"
          animate={{ 
            rotate: [360, 0],
            scale: [1.3, 1, 1.3]
          }}
          transition={{ 
            duration: 22, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
      </div>

      {/* Header */}
      <motion.header 
        className="relative z-10 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg flex-shrink-0"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={handleGoBack}
                  className="border border-orange-200 text-orange-900 hover:bg-orange-50 bg-white/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 p-3 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </motion.div>
              <div className="flex items-center space-x-4">
                <motion.div 
                  className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <img src={itsppLogo} alt="ITSPP Logo" className="w-8 h-8" />
                </motion.div>
                <div>
                  <motion.h1 
                    className="text-3xl bg-gradient-to-r from-orange-900 to-red-700 bg-clip-text text-transparent"
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    Seleccionar Participantes
                  </motion.h1>
                  <motion.p 
                    className="text-orange-600"
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    {curso?.nombre} • {equipo?.nombre}
                  </motion.p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Members List - Takes 3 columns */}
          <div className="lg:col-span-3 overflow-y-auto">
            <motion.div 
              className="mb-8"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="text-center flex-1">
                  <h2 className="text-4xl bg-gradient-to-r from-orange-900 via-red-800 to-pink-700 bg-clip-text text-transparent mb-4">
                    Integrantes del Equipo
                  </h2>
                  <p className="text-gray-600 text-lg">Selecciona los participantes para quienes deseas generar constancias.</p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <button
                    onClick={seleccionarTodos}
                    className="border border-orange-200 text-orange-900 hover:bg-orange-50 bg-white/80 backdrop-blur-sm shadow-lg px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>{integrantesSeleccionados.length === integrantes.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}</span>
                  </button>
                </motion.div>
              </div>
              
              <motion.div 
                className="p-6 bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl border border-orange-200 shadow-lg"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <div className="flex items-center justify-center space-x-3">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 360, 0]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Check className="w-6 h-6 text-orange-700" />
                  </motion.div>
                  <p className="text-orange-800 text-lg font-medium">
                    {integrantesSeleccionados.length} de {integrantes.length} participantes seleccionados
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* Members List */}
            {integrantes.length === 0 ? (
              <motion.div 
                className="text-center py-16"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <User className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                </motion.div>
                <h3 className="text-2xl text-gray-500 mb-3">No hay integrantes registrados</h3>
                <p className="text-gray-400 text-lg">Este equipo no tiene integrantes registrados.</p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {integrantes.map((integrante, index) => {
                  const isSelected = integrantesSeleccionados.some(i => i.nombre === integrante.nombre);
                  const color = getColor(index);
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -100, rotateY: -20 }}
                      animate={{ opacity: 1, x: 0, rotateY: 0 }}
                      transition={{ 
                        duration: 0.8, 
                        delay: index * 0.1 + 0.4,
                        type: "spring",
                        stiffness: 100
                      }}
                      whileHover={{ 
                        scale: 1.02, 
                        x: 10,
                        rotateY: 2
                      }}
                    >
                      <div 
                        onClick={() => toggleIntegrante(integrante)}
                        className={`transition-all duration-300 rounded-xl overflow-hidden cursor-pointer ${
                          isSelected 
                            ? 'border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-red-50 shadow-xl transform scale-[1.02]' 
                            : 'border border-orange-100 hover:border-orange-200 hover:shadow-lg bg-white/80 backdrop-blur-sm'
                        }`}
                      >
                        <div className="p-6">
                          <div className="flex items-center space-x-6">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                                isSelected 
                                  ? 'bg-orange-500 border-orange-500' 
                                  : 'border-gray-300'
                              }`}
                            >
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </motion.div>
                            
                            <div className="flex-1 flex items-center justify-between">
                              {/* Basic Info */}
                              <div className="flex items-center space-x-4">
                                <motion.div 
                                  className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white shadow-lg`}
                                  whileHover={{ rotate: 360, scale: 1.1 }}
                                  transition={{ duration: 0.6 }}
                                >
                                  <User className="w-6 h-6" />
                                </motion.div>
                                <div>
                                  <h3 className="text-xl text-gray-900 font-medium">{integrante.nombre || `Integrante ${index + 1}`}</h3>
                                  {integrante.email && (
                                    <p className="text-sm text-gray-600">{integrante.email}</p>
                                  )}
                                </div>
                              </div>

                              {/* Role Badge */}
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2 }}
                              >
                                <div 
                                  className={`${integrante.nombre === equipo?.lider 
                                    ? `bg-gradient-to-r ${color} text-white shadow-lg px-3 py-1 rounded-full` 
                                    : `border-2 bg-gradient-to-r ${color} bg-clip-text text-transparent border-current px-3 py-1 rounded-full`
                                  } text-sm font-medium flex items-center space-x-1`}
                                >
                                  {getRoleIcon(integrante.nombre, equipo?.lider)}
                                  <span className="ml-1">{integrante.nombre === equipo?.lider ? 'Líder del Equipo' : 'Integrante'}</span>
                                </div>
                              </motion.div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Right Sidebar - Action Panel */}
          <motion.div 
            className="lg:col-span-1 flex flex-col justify-center"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <div className="bg-gradient-to-r from-orange-100 to-red-100 border-orange-200 shadow-xl rounded-xl overflow-hidden">
              <div className="p-8 text-center">
                <motion.div
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="w-16 h-16 text-orange-600 mx-auto mb-6" />
                </motion.div>
                
                <motion.h3 
                  className="text-2xl text-orange-900 mb-3"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                >
                  ¿Listos para continuar?
                </motion.h3>
                
                <motion.p 
                  className="text-gray-600 mb-8 text-lg"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.4 }}
                >
                  Procederemos a generar las constancias para los {integrantesSeleccionados.length} participantes seleccionados.
                </motion.p>
                
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.6 }}
                >
                  <button
                    onClick={handleContinuar}
                    disabled={integrantesSeleccionados.length === 0}
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transition-all duration-300 w-full rounded-xl flex items-center justify-center"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Continuar con Constancias ({integrantesSeleccionados.length})
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}