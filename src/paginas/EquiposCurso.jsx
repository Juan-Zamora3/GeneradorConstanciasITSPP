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
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 relative overflow-hidden flex flex-col">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl"
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
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full blur-3xl"
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
                  className="border border-blue-200 text-blue-900 hover:bg-blue-50 bg-white/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 p-3 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </motion.div>
              <div className="flex items-center space-x-4">
                <motion.div 
                  className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <img src={itsppLogo} alt="ITSPP Logo" className="w-8 h-8" />
                </motion.div>
                <div>
                  <motion.h1 
                    className="text-3xl bg-gradient-to-r from-blue-900 to-cyan-700 bg-clip-text text-transparent"
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    Equipos Participantes
                  </motion.h1>
                  <motion.p 
                    className="text-blue-600"
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
        <div className="h-full max-w-7xl mx-auto px-12 py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Teams Section - Takes 3 columns */}
          <div className="lg:col-span-3 overflow-y-auto px-6">
            {/* Search Section */}
            <motion.div 
              className="mb-8"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >

              
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
                    className="w-full pl-12 pr-4 py-3 border-blue-200 focus:border-blue-400 focus:ring-blue-400 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl font-medium"
                  />
                </div>
                <motion.p 
                  className="text-gray-600 mt-3 text-center font-medium"
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
              <div className="flex justify-center items-center h-64">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {equiposFiltrados.map((equipo, index) => {
                  const teamColor = getTeamColor(index, equipo.categoria);
                  const colorNumber = String(index + 1).padStart(2, '0');
                  
                  return (
                    <motion.div
                      key={equipo.id}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        duration: 0.5, 
                        delay: index * 0.1
                      }}
                      whileHover={{ 
                        y: -5,
                        scale: 1.02
                      }}
                      className="cursor-pointer"
                      onClick={() => navigate(`/seleccionar-integrantes/${cursoId}/${equipo.id}`)}
                    >
                      <div className="w-full bg-white shadow-[0px_0px_15px_rgba(0,0,0,0.09)] p-9 space-y-3 relative overflow-hidden rounded-lg hover:shadow-[0px_0px_25px_rgba(0,0,0,0.15)] transition-shadow duration-300">
                        {/* Círculo de color en esquina superior derecha con estrella */}
                        <motion.div 
                          className={`w-24 h-24 bg-gradient-to-br ${teamColor} rounded-full absolute -right-5 -top-7 flex items-center justify-center`}
                          whileHover={{ 
                            rotate: 360
                          }}
                          transition={{ 
                            duration: 2, 
                            ease: "easeInOut" 
                          }}
                        >
                          <Star className="w-8 h-8 text-white fill-white" />
                        </motion.div>
                        
                        {/* Ícono principal */}
                        <div className={`fill-current w-12 text-gray-600`}>
                          <svg 
                            viewBox="0 0 24 24" 
                            data-name="Layer 1" 
                            id="Layer_1" 
                            xmlns="http://www.w3.org/2000/svg"
                          > 
                            <path 
                              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                            />
                          </svg>
                        </div>
                        
                        {/* Título del equipo */}
                        <h1 className="font-semibold text-xl text-gray-900 leading-tight">
                          {equipo.nombre}
                        </h1>
                        
                        {/* Descripción/Información */}
                        <div className="space-y-2">
                          <p className="text-sm text-zinc-500 leading-6 font-medium">
                            <span className="font-semibold text-zinc-700">Líder:</span> {equipo.lider}
                          </p>
                          <p className="text-sm text-zinc-500 leading-6 font-medium">
                            <span className="font-semibold text-zinc-700">Categoría:</span> {equipo.categoria || 'General'}
                          </p>
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
            <div className="bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-200 shadow-xl sticky top-8 rounded-xl overflow-hidden">
              <div className="p-8 text-center">
                {/* Ícono sin animación de rotación */}
                <div className="mb-6">
                  <Sparkles className="w-16 h-16 text-blue-600 mx-auto" />
                </div>
                
                <h3 className="text-2xl text-blue-900 mb-4 font-semibold">
                  Selecciona un Equipo
                </h3>
                
                <p className="text-blue-700 mb-6 leading-relaxed font-medium">
                  Haz clic en cualquier equipo para ver sus integrantes y generar las constancias correspondientes.
                </p>
                
                <div className="space-y-3 text-sm text-blue-600">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">Equipos por categoría</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">Información del líder</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="font-medium">Ver integrantes</span>
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