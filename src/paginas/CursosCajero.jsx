import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../servicios/firebaseConfig';
import { IoMdArrowRoundBack } from "react-icons/io";
import { MdSchool } from "react-icons/md";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Users, Trophy, Sparkles, Zap, Target, Award } from "lucide-react";
import itsppLogo from '../assets/logo.png';

export default function CursosCajero() {
  const navigate = useNavigate();
  const [cursosActivos, setCursosActivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

  const handleGoBack = () => {
    navigate('/pantalla-cajero');
  };

  // Cargar cursos desde Firebase
  useEffect(() => {
    const cursosRef = collection(db, 'Cursos')
    const q = query(cursosRef, orderBy('fechaInicio', 'asc'))

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0) // Establecer a medianoche para comparación de fechas

      const cursosData = []

      for (const doc of snapshot.docs) {
        const data = doc.data()
        
        // Obtener el número real de equipos registrados desde las encuestas
        let equiposRegistrados = 0
        try {
          const encuestasQuery = query(collection(db, 'encuestas'), where('cursoId', '==', doc.id))
          const encuestasSnapshot = await getDocs(encuestasQuery)
          
          for (const encuestaDoc of encuestasSnapshot.docs) {
            const respuestasRef = collection(encuestaDoc.ref, 'respuestas')
            const respuestasSnapshot = await getDocs(respuestasRef)
            equiposRegistrados += respuestasSnapshot.size
          }
        } catch (error) {
          console.error('Error al obtener equipos registrados:', error)
          // Fallback al método anterior si hay error
          equiposRegistrados = Array.isArray(data.listas) ? data.listas.length : 0
        }

        const curso = {
          id: doc.id,
          nombre: data.cursoNombre || 'Sin título',
          instructor: data.asesor || 'Sin instructor',
          participantes: equiposRegistrados,
          fechaInicio: data.fechaInicio || '',
          fechaFin: data.fechaFin || '',
          estado: data.estado || 'proximo',
          categoria: data.categoria || '',
          descripcion: data.descripcion || '',
          ubicacion: data.ubicacion || '',
          imagen: data.imageUrl || ''
        }

        // Filtrar solo cursos activos (fecha fin no ha llegado)
        if (curso.fechaFin) {
          const fechaFin = new Date(curso.fechaFin)
          fechaFin.setHours(23, 59, 59, 999) // Establecer al final del día
          
          if (fechaFin >= hoy) {
            cursosData.push(curso)
          }
        }
      }

      setCursosActivos(cursosData)
      setLoading(false)
    }, (error) => {
      console.error('Error al cargar cursos:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Calcular progreso basado en fechas
  const calcularProgreso = (fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin) return 0
    
    const inicio = new Date(fechaInicio)
    const fin = new Date(fechaFin)
    const hoy = new Date()
    
    if (hoy < inicio) return 0 // Curso no ha comenzado
    if (hoy > fin) return 100 // Curso terminado
    
    const duracionTotal = fin - inicio
    const tiempoTranscurrido = hoy - inicio
    
    return Math.round((tiempoTranscurrido / duracionTotal) * 100)
  }

  // Asignar iconos y colores a los cursos
  const getIconAndColor = (index, categoria) => {
    const icons = [
      <Zap className="w-8 h-8" />,
      <Target className="w-8 h-8" />,
      <Sparkles className="w-8 h-8" />,
      <Award className="w-8 h-8" />
    ];
    
    const colors = [
      'from-blue-500 via-blue-600 to-cyan-600',
      'from-green-500 via-green-600 to-emerald-600',
      'from-red-500 via-red-600 to-pink-600',
      'from-purple-500 via-purple-600 to-violet-600',
      'from-orange-500 via-orange-600 to-red-600',
      'from-teal-500 via-teal-600 to-cyan-600'
    ];
    
    // Asignar color basado en categoría si existe, o por índice
    let colorIndex = index % colors.length;
    if (categoria) {
      // Mapeo simple de categorías a colores
      const categoriaLower = categoria.toLowerCase();
      if (categoriaLower.includes('software') || categoriaLower.includes('informática')) {
        colorIndex = 0; // Azul
      } else if (categoriaLower.includes('mecatrónica') || categoriaLower.includes('mecánica')) {
        colorIndex = 1; // Verde
      } else if (categoriaLower.includes('administración') || categoriaLower.includes('empresarial')) {
        colorIndex = 2; // Rojo
      } else if (categoriaLower.includes('química') || categoriaLower.includes('biología')) {
        colorIndex = 3; // Púrpura
      } else if (categoriaLower.includes('electrónica') || categoriaLower.includes('eléctrica')) {
        colorIndex = 4; // Naranja
      } else if (categoriaLower.includes('civil') || categoriaLower.includes('construcción')) {
        colorIndex = 5; // Teal
      }
    }
    
    return {
      icon: icons[index % icons.length],
      color: colors[colorIndex]
    };
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
                  className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg"
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
                    Cursos Activos
                  </motion.h1>
                  <motion.p 
                    className="text-blue-600"
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    Instituto Tecnológico Superior de Puerto Peñasco
                  </motion.p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content - Full height grid */}
      <main className="relative z-10 flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Cursos Grid - Takes 3 columns */}
          <div className="lg:col-span-3 overflow-y-auto">
            <motion.div 
              className="mb-8 text-center"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
            </motion.div>

            {loading ? (
              <motion.div 
                className="flex items-center justify-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 text-lg">Cargando cursos...</span>
              </motion.div>
            ) : cursosActivos.length === 0 ? (
              <motion.div 
                className="text-center py-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Sparkles className="mx-auto h-16 w-16 text-blue-400 opacity-70" />
                <h3 className="mt-4 text-xl font-medium text-gray-900">No hay cursos activos</h3>
                <p className="mt-2 text-gray-500 max-w-md mx-auto">
                  No se encontraron cursos con fecha de finalización pendiente. Los cursos aparecerán aquí cuando estén disponibles.
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mx-4">
                {cursosActivos.map((curso, index) => {
                  const { icon, color } = getIconAndColor(index, curso.categoria);
                  return (
                    <motion.div
                      key={curso.id}
                      initial={{ opacity: 0, y: 100, rotateY: -15 }}
                      animate={{ opacity: 1, y: 0, rotateY: 0 }}
                      transition={{ 
                        duration: 0.8, 
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 100
                      }}
                      whileHover={{ 
                        y: -10, 
                        rotateY: 5,
                        scale: 1.02
                      }}
                      onHoverStart={() => setHoveredCard(curso.id)}
                      onHoverEnd={() => setHoveredCard(null)}
                      className="h-full cursor-pointer"
                      onClick={() => navigate(`/equipos-curso/${curso.id}`)}
                    >
                      <div className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-500 h-full bg-white/80 backdrop-blur-sm overflow-hidden relative rounded-xl">
                        {/* Gradient Background Overlay */}
                        <div 
                          className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} 
                        />
                        
                        {/* Course Image Header */}
                        <div className="relative h-48 overflow-hidden">
                          {curso.imagen ? (
                            <img 
                              src={curso.imagen} 
                              alt={curso.nombre}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${color} flex items-center justify-center`}>
                              <MdSchool className="w-16 h-16 text-white/80" />
                            </div>
                          )}
                          {/* Overlay gradient for better text readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                          
                          {/* Icon positioned in bottom-left corner */}
                          <div className="absolute bottom-3 left-3 z-10">
                            <div 
                              className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white shadow-lg backdrop-blur-sm bg-opacity-90`}
                            >
                              {icon}
                            </div>
                          </div>
                        </div>

                        <div className="pb-2 relative z-10 p-4">
                          <h3 className="text-xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent group-hover:from-blue-900 group-hover:to-purple-800 transition-all duration-300 font-bold mb-2">
                            {curso.nombre}
                          </h3>
                          
                          <motion.div 
                            className="text-sm font-medium mb-2"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: index * 0.1 + 0.3 }}
                          >
                            <span className={`inline-block px-3 py-1 rounded-full border-2 bg-gradient-to-r ${color} bg-clip-text text-transparent border-current`} style={{ letterSpacing: 'normal' }}>
                              {curso.instructor || 'Sin coordinador'}
                            </span>
                          </motion.div>
                        </div>
                        
                        <div className="space-y-3 relative z-10 px-4 pb-4">
                          <motion.p 
                            className="text-gray-600 leading-relaxed text-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: index * 0.1 + 0.5 }}
                          >
                            {curso.descripcion || `Curso coordinado por ${curso.instructor}`}
                          </motion.p>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <motion.div 
                              className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg"
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Calendar className="w-3 h-3 text-blue-600" />
                              <span className="text-xs text-blue-800">{curso.fechaFin ? new Date(curso.fechaFin).toLocaleDateString() : 'Fecha pendiente'}</span>
                            </motion.div>
                            <motion.div 
                              className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg"
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Users className="w-3 h-3 text-green-600" />
                              <span className="text-xs text-green-800">{curso.participantes || 0} equipos</span>
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
            <div className="bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-200 shadow-xl sticky top-8 rounded-xl overflow-hidden">
              <div className="p-8 text-center">
                <div>
                  <Sparkles className="w-16 h-16 text-blue-600 mx-auto mb-6" />
                </div>
                
                <h3 className="text-2xl text-blue-900 mb-4">
                  Selecciona un Curso
                </h3>
                
                <p className="text-blue-700 mb-6 leading-relaxed">
                  Haz clic en cualquier curso de la lista para ver los equipos participantes y generar constancias.
                </p>
                
                <div className="space-y-3 text-sm text-blue-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Búsqueda por categoría</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Equipos participantes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Constancias oficiales</span>
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