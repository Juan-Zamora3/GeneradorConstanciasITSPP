import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdSchool, MdLocationOn, MdWeb } from "react-icons/md";
import { Award, Users, Calendar, Sparkles, Star } from "lucide-react";
import { motion } from "framer-motion";
import itsppLogo from '../assets/logo.png';

export default function PantallaCajero() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNavigateToCourses = () => {
    navigate('/cursos-cajero');
  };

  const backgroundImages = [
    "https://images.unsplash.com/photo-1685456891912-c09f9cd252eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwbW9kZXJufGVufDF8fHx8MTc1ODYxNjU1Nnww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1758270704534-fd9715bffc0e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwc3R1ZGVudHMlMjBsZWFybmluZ3xlbnwxfHx8fDE3NTg2OTM1Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1707485036935-acd1a7572fa6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbmdpbmVlcmluZyUyMGxhYm9yYXRvcnl8ZW58MXx8fHwxNzU4NjkzNTI4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1738949538812-aebbb54a0592?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwZ3JhZHVhdGlvbiUyMGNlcmVtb255fGVufDF8fHx8MTc1ODU3NDMyM3ww&ixlib=rb-4.1.0&q=80&w=1080"
  ];

  const carouselContent = [
    {
      title: "Campus Tecnológico",
      subtitle: "Instalaciones de Vanguardia",
      description: "Laboratorios equipados con la última tecnología para el desarrollo de proyectos innovadores",
      icon: <Award className="w-8 h-8" />,
      color: "from-blue-500 to-cyan-600",
      courseImage: "https://images.unsplash.com/photo-1562774053-701939374585?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwY291cnNlfGVufDF8fHx8MTc1ODYxNjU1Nnww&ixlib=rb-4.1.0&q=80&w=400"
    },
    {
      title: "Estudiantes Destacados",
      subtitle: "Formando Líderes del Futuro",
      description: "Estudiantes comprometidos con la excelencia académica y el desarrollo tecnológico",
      icon: <Users className="w-8 h-8" />,
      color: "from-green-500 to-emerald-600",
      courseImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50cyUyMGdyb3VwfGVufDF8fHx8MTc1ODYxNjU1Nnww&ixlib=rb-4.1.0&q=80&w=400"
    },
    {
      title: "Laboratorios Especializados",
      subtitle: "Innovación y Tecnología",
      description: "Espacios diseñados para la investigación y desarrollo de soluciones tecnológicas",
      icon: <Sparkles className="w-8 h-8" />,
      color: "from-purple-500 to-violet-600",
      courseImage: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYWJvcmF0b3J5JTIwZXF1aXBtZW50fGVufDF8fHx8MTc1ODYxNjU1Nnww&ixlib=rb-4.1.0&q=80&w=400"
    },
    {
      title: "Eventos Académicos",
      subtitle: "Celebrando el Éxito",
      description: "Ceremonias y eventos que reconocen el esfuerzo y dedicación de nuestros estudiantes",
      icon: <Star className="w-8 h-8" />,
      color: "from-red-500 to-pink-600",
      courseImage: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhY2FkZW1pYyUyMGV2ZW50fGVufDF8fHx8MTc1ODYxNjU1Nnww&ixlib=rb-4.1.0&q=80&w=400"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentSlide]);

  return (
    <div className="h-screen relative overflow-hidden">
      {/* Background Images with Parallax Effect */}
      <div className="absolute inset-0">
        {backgroundImages.map((image, index) => (
          <motion.div
            key={index}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ 
              opacity: index === currentSlide ? 1 : 0,
              scale: index === currentSlide ? 1 : 1.1
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <div 
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${image})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-blue-800/60 to-transparent" />
          </motion.div>
        ))}
      </div>

      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-xl"
          animate={{ 
            y: [0, -30, 0],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        <motion.div
          className="absolute bottom-40 left-10 w-24 h-24 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-lg rotate-45 blur-lg"
          animate={{ 
            x: [0, 20, 0],
            rotate: [45, 225, 45]
          }}
          transition={{ 
            duration: 12, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/3 w-16 h-16 bg-gradient-to-br from-red-400/20 to-pink-400/20 rounded-full blur-lg"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
      </div>

      {/* Header */}
      <motion.header 
        className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20 shadow-lg"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-8 py-3">
          <div className="flex items-center space-x-4">
            <motion.div 
              className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ duration: 0.3 }}
            >
              <img src={itsppLogo} alt="ITSPP Logo" className="w-12 h-12" />
            </motion.div>
            <div>
              <h1 className="text-2xl text-white drop-shadow-lg">Instituto Tecnológico Superior de Puerto Peñasco</h1>
              <p className="text-blue-100">Sistema de Constancias Automático</p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content - Full Height Layout */}
      <main className="relative z-10 flex-1 h-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full max-w-7xl mx-auto px-8 py-8">
          
          {/* Left Side - Static Info */}
          <motion.div 
            className="flex flex-col justify-center space-y-6"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <div className="space-y-6">
              <motion.h2 
                className="text-5xl text-white drop-shadow-2xl leading-tight"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                Bienvenido al Sistema de 
                <motion.span 
                  className="block text-cyan-300"
                  animate={{ 
                    backgroundPosition: ["0% 50%", "100% 50%"],
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    repeatType: "reverse" 
                  }}
                >
                  Constancias Digitales
                </motion.span>
              </motion.h2>
              
              <motion.p 
                className="text-blue-100 text-xl leading-relaxed drop-shadow-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.7 }}
              >
                Genera e imprime tus constancias de participación en concursos y eventos académicos 
                de manera rápida y sencilla. Sistema automatizado para estudiantes del ITSPP.
              </motion.p>
            </div>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              <div className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl rounded-lg">
                <div className="p-6">
                  <h3 className="text-white mb-4 text-lg">Características del Sistema</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { icon: <Award className="w-4 h-4" />, text: "Constancias oficiales", color: "text-yellow-300" },
                      { icon: <Calendar className="w-4 h-4" />, text: "Impresión inmediata", color: "text-green-300" },
                      { icon: <Users className="w-4 h-4" />, text: "Búsqueda rápida", color: "text-blue-300" },
                      { icon: <Sparkles className="w-4 h-4" />, text: "Personalización", color: "text-purple-300" }
                    ].map((feature, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center space-x-2 p-2 rounded-lg bg-white/5 backdrop-blur-sm"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                      >
                        <div className={feature.color}>
                          {feature.icon}
                        </div>
                        <span className="text-white text-sm">{feature.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Carousel and Button */}
          <motion.div 
            className="flex flex-col justify-center space-y-8"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            {/* Carousel */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl overflow-hidden rounded-lg">
                <div className="p-0 relative h-75">
                  {/* Carousel Content */}
                  <motion.div
                    key={currentSlide}
                    className={`absolute inset-0 bg-gradient-to-br ${carouselContent[currentSlide].color} p-8 flex flex-col justify-center`}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <motion.div
                      className="text-white mb-4"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      {carouselContent[currentSlide].icon}
                    </motion.div>
                    
                    <motion.h3 
                      className="text-3xl text-white mb-2"
                      initial={{ x: -30, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      {carouselContent[currentSlide].title}
                    </motion.h3>
                    
                    <motion.p 
                      className="text-white/90 text-lg mb-4"
                      initial={{ x: -30, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    >
                      {carouselContent[currentSlide].subtitle}
                    </motion.p>
                    
                    <motion.p 
                      className="text-white/80 leading-relaxed"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                    >
                      {carouselContent[currentSlide].description}
                    </motion.p>
                  </motion.div>
                </div>
              </div>

            </div>

            {/* Large Start Button */}
            <motion.div 
              className="w-full"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -10 }}
                whileTap={{ scale: 0.95 }}
                className="w-full"
              >
                <button 
                  onClick={handleNavigateToCourses}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-8 text-2xl rounded-3xl shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 border-0 flex items-center justify-center"
                >
                  <motion.div
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="mr-4"
                  >
                    <Star className="w-8 h-8" />
                  </motion.div>
                  Comenzar
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <motion.footer 
        className="relative z-10 bg-white/10 backdrop-blur-md border-t border-white/20 shadow-lg"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.5 }}
      >
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center md:text-left">
            <motion.div 
              className="space-y-1"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.7 }}
            >
              <h4 className="text-white text-sm font-medium">Instituto Tecnológico Superior</h4>
              <p className="text-blue-100 text-xs">de Puerto Peñasco</p>
              <p className="text-blue-200 text-xs">Tecnológico Nacional de México</p>
            </motion.div>
            
            <motion.div 
              className="space-y-1"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.8 }}
            >
              <h4 className="text-white text-sm font-medium">Contacto</h4>
              <p className="text-blue-100 text-xs">Puerto Peñasco, Sonora</p>
              <p className="text-blue-100 text-xs">México</p>
            </motion.div>
            
            <motion.div 
              className="space-y-1"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.9 }}
            >
              <h4 className="text-white text-sm font-medium">Sistema de Constancias</h4>
              <p className="text-blue-100 text-xs">Versión 2024.1</p>
              <p className="text-blue-200 text-xs">© 2024 ITSPP</p>
            </motion.div>
          </div>
          

        </div>
      </motion.footer>

      {/* Agregar estilos para la animación de spin lenta */}
      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
      `}</style>
    </div>
  );
}