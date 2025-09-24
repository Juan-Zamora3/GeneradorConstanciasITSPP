import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../servicios/firebaseConfig';
import { MdGroups } from "react-icons/md";
import { IoMdArrowRoundBack } from "react-icons/io";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Star, Sparkles } from "lucide-react";
import itsppLogo from '../assets/logo.png';

export default function EquiposCurso() {
  const navigate = useNavigate();
  const { cursoId } = useParams();
  const [equipos, setEquipos] = useState([]);
  const [equiposFiltrados, setEquiposFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [curso, setCurso] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  const handleGoBack = () => {
    navigate('/cursos-cajero');
  };

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

  // Asignar colores a los equipos
  const getTeamColor = (index, categoria) => {
    const colors = [
      'from-yellow-400 via-yellow-500 to-orange-500',
      'from-blue-500 via-blue-600 to-cyan-600',
      'from-green-500 via-green-600 to-emerald-600',
      'from-red-500 via-red-600 to-pink-600',
      'from-purple-500 via-purple-600 to-violet-600',
      'from-teal-500 via-teal-600 to-cyan-600'
    ];
    
    // Asignar color basado en categoría si existe, o por índice
    let colorIndex = index % colors.length;
    if (categoria) {
      // Mapeo simple de categorías a colores
      const categoriaLower = categoria.toLowerCase();
      if (categoriaLower.includes('web') || categoriaLower.includes('software')) {
        colorIndex = 1; // Azul
      } else if (categoriaLower.includes('móvil') || categoriaLower.includes('mobile')) {
        colorIndex = 0; // Amarillo
      } else if (categoriaLower.includes('inteligencia') || categoriaLower.includes('ia')) {
        colorIndex = 2; // Verde
      } else if (categoriaLower.includes('seguridad') || categoriaLower.includes('ciber')) {
        colorIndex = 3; // Rojo
      } else if (categoriaLower.includes('iot') || categoriaLower.includes('internet')) {
        colorIndex = 4; // Púrpura
      } else if (categoriaLower.includes('realidad') || categoriaLower.includes('virtual')) {
        colorIndex = 5; // Teal
      }
    }
    
    return colors[colorIndex];
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-green-50 to-cyan-50 relative overflow-hidden flex flex-col">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/10 to-cyan-400/10 rounded-full blur-3xl"
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"
          animate={{ 
            rotate: [360, 0],
            scale: [1.2, 1, 1.2]
          }}
          transition={{ 
            duration: 25, 
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
                  className="border border-green-200 text-green-900 hover:bg-green-50 bg-white/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 p-3 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </motion.div>
              <div className="flex items-center space-x-4">
                <motion.div 
                  className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <img src={itsppLogo} alt="ITSPP Logo" className="w-8 h-8" />
                </motion.div>
                <div>
                  <motion.h1 
                    className="text-3xl bg-gradient-to-r from-green-900 to-cyan-700 bg-clip-text text-transparent"
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    Equipos Participantes
                  </motion.h1>
                  <motion.p 
                    className="text-green-600"
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    {curso ? curso.nombre : 'Cargando curso...'}
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
          
          {/* Teams Section - Takes 3 columns */}
          <div className="lg:col-span-3 overflow-y-auto">
            {/* Search Section */}
            <motion.div 
              className="mb-8"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <h2 className="text-4xl bg-gradient-to-r from-green-900 via-blue-800 to-cyan-700 bg-clip-text text-transparent mb-6 text-center">
                Buscar Equipo
              </h2>
              
              <motion.div 
                className="relative max-w-2xl mx-auto"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre de equipo, líder o categoría..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-green-200 focus:border-green-400 focus:ring-green-400 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl"
                  />
                </div>
                <motion.p 
                  className="text-gray-600 mt-3 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  {equiposFiltrados.length} de {equipos.length} equipos encontrados
                </motion.p>
              </motion.div>
            </motion.div>

            {/* Teams Grid */}
            {loading ? (
              <motion.div 
                className="flex items-center justify-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <span className="ml-3 text-gray-600 text-lg">Cargando equipos...</span>
              </motion.div>
            ) : equiposFiltrados.length === 0 ? (
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
                  <Search className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                </motion.div>
                <h3 className="text-2xl text-gray-500 mb-3">No se encontraron equipos</h3>
                <p className="text-gray-400 text-lg">Intenta con otros términos de búsqueda</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {equiposFiltrados.map((equipo, index) => {
                  const teamColor = getTeamColor(index, equipo.categoria);
                  return (
                    <motion.div
                      key={equipo.id}
                      initial={{ opacity: 0, y: 100, rotateX: -15 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      transition={{ 
                        duration: 0.8, 
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 100
                      }}
                      whileHover={{ 
                        y: -15, 
                        rotateX: 5,
                        scale: 1.03
                      }}
                      onHoverStart={() => setHoveredCard(equipo.id)}
                      onHoverEnd={() => setHoveredCard(null)}
                      className="h-full cursor-pointer"
                      onClick={() => navigate(`/seleccionar-integrantes/${cursoId}/${equipo.id}`)}
                    >
                      <div className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-500 h-full bg-white/80 backdrop-blur-sm overflow-hidden relative rounded-xl">
                        {/* Gradient Background Overlay */}
                        <motion.div 
                          className={`absolute inset-0 bg-gradient-to-br ${teamColor} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                          animate={{ opacity: hoveredCard === equipo.id ? 0.1 : 0 }}
                        />
                        
                        {/* Floating Icons */}
                        <motion.div
                          className="absolute top-4 right-4 opacity-10 group-hover:opacity-30 transition-opacity duration-500"
                          animate={{
                            rotate: hoveredCard === equipo.id ? [0, 360] : 0,
                            scale: hoveredCard === equipo.id ? [1, 1.2, 1] : 1
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: hoveredCard === equipo.id ? Infinity : 0,
                            ease: "linear"
                          }}
                        >
                          <Star className="w-16 h-16 text-gray-400" />
                        </motion.div>

                        <div className="pb-4 relative z-10 p-6">
                          <div className="flex items-start justify-between mb-4">
                            <motion.div 
                              className={`w-16 h-16 bg-gradient-to-br ${teamColor} rounded-2xl flex items-center justify-center text-white shadow-lg`}
                              whileHover={{ rotate: 360, scale: 1.1 }}
                              transition={{ duration: 0.6 }}
                            >
                              <Star className="w-8 h-8" />
                            </motion.div>
                          </div>
                          
                          <h3 className="text-xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent group-hover:from-blue-900 group-hover:to-purple-800 transition-all duration-300 font-bold mb-3">
                            {equipo.nombre}
                          </h3>
                        </div>
                        
                        <div className="space-y-4 relative z-10 px-6 pb-6">
                          <div className="space-y-3">
                            <div className="p-3 bg-purple-50 rounded-xl">
                              <span className="text-purple-600 text-sm font-medium">Líder del equipo:</span>
                              <p className="text-purple-900 font-medium">{equipo.lider}</p>
                            </div>
                            
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div 
                                className={`border-2 bg-gradient-to-r ${teamColor} bg-clip-text text-transparent border-current w-full justify-center py-2 rounded-full text-center`}
                              >
                                {equipo.categoria || 'General'}
                              </div>
                            </motion.div>
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
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="bg-gradient-to-br from-green-100 to-cyan-100 border-green-200 shadow-xl sticky top-8 rounded-xl overflow-hidden">
              <div className="p-8 text-center">
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="w-16 h-16 text-green-600 mx-auto mb-6" />
                </motion.div>
                
                <h3 className="text-2xl text-green-900 mb-4">
                  Selecciona un Equipo
                </h3>
                
                <p className="text-green-700 mb-6 leading-relaxed">
                  Haz clic en cualquier equipo para ver sus integrantes y generar las constancias correspondientes.
                </p>
                
                <div className="space-y-3 text-sm text-green-600">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>Equipos por categoría</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Información del líder</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Ver integrantes</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}