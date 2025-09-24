import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { MdPrint, MdDownload, MdCheckCircle, MdHome } from "react-icons/md";
import { PDFDocument, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { motion } from "framer-motion";
import { CheckCircle, Printer, FileText, Home, Sparkles, Award, Star } from "lucide-react";
import itsppLogo from '../assets/logo.png';

export default function ImprimirConstancias() {
  const navigate = useNavigate();
  const { cursoId, equipoId } = useParams();
  const location = useLocation();
  const { constancias, equipo, curso, factura } = location.state || {};

  const [generandoPDFs, setGenerandoPDFs] = useState(true);
  const [progreso, setProgreso] = useState(0);
  const [constanciasGeneradas, setConstanciasGeneradas] = useState([]);
  const [impresionCompleta, setImpresionCompleta] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(10);

  const generarPDFConstancia = async (constancia) => {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // Tamaño A4
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const { width, height } = page.getSize();

      // Header
      page.drawText('INSTITUTO TECNOLÓGICO SUPERIOR', {
        x: width / 2 - 150,
        y: height - 100,
        size: 16,
        font: boldFont,
      });

      page.drawText('DE PUERTO PEÑASCO', {
        x: width / 2 - 100,
        y: height - 120,
        size: 16,
        font: boldFont,
      });

      // Título
      page.drawText('CONSTANCIA DE PARTICIPACIÓN', {
        x: width / 2 - 140,
        y: height - 200,
        size: 20,
        font: boldFont,
      });

      // Contenido
      page.drawText('Se otorga la presente constancia a:', {
        x: width / 2 - 120,
        y: height - 280,
        size: 14,
        font: font,
      });

      page.drawText(constancia.nombre.toUpperCase(), {
        x: width / 2 - (constancia.nombre.length * 6),
        y: height - 320,
        size: 18,
        font: boldFont,
      });

      page.drawText(constancia.mensaje, {
        x: 50,
        y: height - 380,
        size: 12,
        font: font,
        maxWidth: width - 100,
      });

      // Información adicional
      page.drawText(`Equipo: ${constancia.equipo}`, {
        x: 50,
        y: height - 450,
        size: 12,
        font: font,
      });

      page.drawText(`Categoría: ${constancia.categoria}`, {
        x: 50,
        y: height - 470,
        size: 12,
        font: font,
      });

      page.drawText(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, {
        x: width - 200,
        y: height - 750,
        size: 10,
        font: font,
      });

      const pdfBytes = await pdfDoc.save();
      return pdfBytes;
    } catch (error) {
      console.error('Error generando PDF:', error);
      return null;
    }
  };

  const generarTodasLasConstancias = async () => {
    if (!constancias || constancias.length === 0) return;

    setGenerandoPDFs(true);
    const constanciasConPDF = [];

    for (let i = 0; i < constancias.length; i++) {
      const constancia = constancias[i];
      setProgreso(((i + 1) / constancias.length) * 100);
      
      const pdfBytes = await generarPDFConstancia(constancia);
      if (pdfBytes) {
        constanciasConPDF.push({
          ...constancia,
          pdfBytes,
          pdfUrl: URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }))
        });
      }
      
      // Simular tiempo de generación
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setConstanciasGeneradas(constanciasConPDF);
    setGenerandoPDFs(false);
    
    // Simular impresión automática
    setTimeout(() => {
      setImpresionCompleta(true);
    }, 2000);
  };

  const descargarTodas = async () => {
    if (constanciasGeneradas.length === 0) return;

    const zip = new JSZip();
    
    constanciasGeneradas.forEach((constancia, index) => {
      const nombreArchivo = `Constancia_${constancia.nombre.replace(/\s+/g, '_')}.pdf`;
      zip.file(nombreArchivo, constancia.pdfBytes);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `Constancias_${equipo?.nombre || 'Equipo'}.zip`);
  };

  const handleVolverInicio = () => {
    navigate('/pantalla-cajero');
  };

  useEffect(() => {
    if (!constancias || !equipo || !curso || !factura) {
      navigate(`/equipos-curso/${cursoId}`);
      return;
    }

    generarTodasLasConstancias();
  }, [constancias, equipo, curso, factura, cursoId, navigate]);

  // Contador regresivo para retorno automático
  useEffect(() => {
    if (impresionCompleta && tiempoRestante > 0) {
      const timer = setTimeout(() => {
        setTiempoRestante(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (impresionCompleta && tiempoRestante === 0) {
      handleVolverInicio();
    }
  }, [impresionCompleta, tiempoRestante]);

  if (!constancias || !equipo || !curso || !factura) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <motion.div 
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 flex items-center space-x-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="text-gray-700 font-medium">Cargando...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.3, 1],
            x: [0, -30, 0],
            y: [0, 40, 0]
          }}
          transition={{ 
            duration: 18, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"
          animate={{ 
            rotate: [360, 0],
            scale: [1.4, 1, 1.4],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ 
            duration: 22, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        <motion.div
          className="absolute top-1/3 left-1/3 w-60 h-60 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 rounded-full blur-2xl"
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.7, 0.3],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 12, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
      </div>

      {/* Floating Success Elements (only when complete) */}
      {impresionCompleta && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              initial={{ opacity: 0, scale: 0, rotate: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                rotate: [0, 360],
                y: [0, -100]
              }}
              transition={{ 
                duration: 3,
                delay: i * 0.1,
                ease: "easeOut"
              }}
            >
              {i % 3 === 0 ? (
                <Star className="w-4 h-4 text-yellow-400" />
              ) : i % 3 === 1 ? (
                <Sparkles className="w-4 h-4 text-purple-400" />
              ) : (
                <Award className="w-4 h-4 text-green-400" />
              )}
            </motion.div>
          ))}
        </div>
      )}

      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="max-w-3xl mx-auto px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          >
            <div className="bg-white/80 backdrop-blur-xl border-indigo-200 shadow-2xl overflow-hidden relative rounded-xl">
              {/* Decorative top border */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100/50 to-purple-100/50 rounded-full -translate-y-16 translate-x-16"></div>
              
              <div className="p-16 text-center space-y-10">
                {generandoPDFs || !impresionCompleta ? (
                  <>
                    {/* Printing Animation */}
                    <motion.div 
                      className="w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto shadow-2xl"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Printer className="w-16 h-16 text-indigo-600" />
                      </motion.div>
                    </motion.div>

                    <div className="space-y-6">
                      <motion.h1 
                        className="text-4xl bg-gradient-to-r from-indigo-900 to-purple-700 bg-clip-text text-transparent"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      >
                        {generandoPDFs ? 'Generando Constancias' : 'Imprimiendo Constancias'}
                      </motion.h1>
                      <motion.p 
                        className="text-gray-600 text-xl"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                      >
                        {generandoPDFs 
                          ? 'Por favor espera mientras se preparan los documentos...' 
                          : 'Por favor espera mientras se imprimen tus constancias...'}
                      </motion.p>
                    </div>

                    {/* Progress */}
                    <motion.div 
                      className="space-y-6"
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.7 }}
                    >
                      <div className="flex justify-between text-lg text-gray-600">
                        <span>Progreso de {generandoPDFs ? 'generación' : 'impresión'}</span>
                        <span className="font-medium">
                          {generandoPDFs 
                            ? `${Math.ceil((progreso / 100) * constancias.length)} de ${constancias.length} completadas` 
                            : `${Math.min(constanciasGeneradas.length, constancias.length)} de ${constancias.length} completadas`}
                        </span>
                      </div>
                      <div className="relative">
                        <div className="w-full h-4 bg-gray-200 rounded-full"></div>
                        <motion.div
                          className="absolute top-0 left-0 h-4 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"
                          style={{ width: `${generandoPDFs ? progreso : (constanciasGeneradas.length / constancias.length) * 100}%` }}
                          animate={{ 
                            boxShadow: [
                              "0 0 0 rgba(99, 102, 241, 0.4)",
                              "0 0 20px rgba(99, 102, 241, 0.4)",
                              "0 0 0 rgba(99, 102, 241, 0.4)"
                            ]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      </div>
                    </motion.div>

                    {/* Current Certificate */}
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.9 }}
                    >
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-lg rounded-xl">
                        <div className="p-8">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                              >
                                <FileText className="w-8 h-8 text-indigo-600" />
                              </motion.div>
                              <div className="text-left">
                                <p className="text-indigo-900 text-lg font-medium">
                                  {generandoPDFs 
                                    ? `Generando: ${constancias[Math.min(Math.floor((progreso / 100) * constancias.length), constancias.length - 1)]?.nombre}` 
                                    : `Imprimiendo: ${constanciasGeneradas[Math.min(constanciasGeneradas.length - 1, 0)]?.nombre}`
                                  }
                                </p>
                                <p className="text-indigo-600">{curso?.nombre} - {equipo?.nombre}</p>
                              </div>
                            </div>
                            <motion.div 
                              className="w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
                              animate={{ 
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 1, 0.5]
                              }}
                              transition={{ 
                                duration: 1, 
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Certificates List */}
                    <motion.div 
                      className="space-y-4"
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 1.1 }}
                    >
                      <h3 className="text-indigo-900 text-xl font-medium">Constancias en proceso:</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {constancias.map((constancia, index) => {
                          const isCompleted = generandoPDFs 
                            ? index < Math.ceil((progreso / 100) * constancias.length)
                            : index < constanciasGeneradas.length;
                          const isCurrent = generandoPDFs 
                            ? index === Math.floor((progreso / 100) * constancias.length)
                            : index === constanciasGeneradas.length - 1;
                            
                          return (
                            <motion.div 
                              key={index} 
                              className={`flex items-center justify-between p-4 rounded-xl transition-all duration-500 ${
                                isCompleted 
                                  ? 'bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 shadow-sm' 
                                  : isCurrent 
                                    ? 'bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-200 shadow-md' 
                                    : 'bg-gray-50 border border-gray-200'
                              }`}
                              initial={{ x: -50, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ duration: 0.6, delay: 1.3 + index * 0.1 }}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  isCompleted 
                                    ? 'bg-gradient-to-r from-green-400 to-emerald-400' 
                                    : isCurrent 
                                      ? 'bg-gradient-to-r from-indigo-400 to-purple-400 animate-pulse' 
                                      : 'bg-gray-300'
                                }`}></div>
                                <span className={`font-medium ${
                                  isCompleted 
                                    ? 'text-green-700' 
                                    : isCurrent 
                                      ? 'text-indigo-700' 
                                      : 'text-gray-500'
                                }`}>
                                  {constancia.nombre}
                                </span>
                              </div>
                              {isCompleted && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 200 }}
                                >
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                </motion.div>
                              )}
                              {isCurrent && !isCompleted && (
                                <motion.div 
                                  className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full"
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                />
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                ) : (
                  <>
                    <motion.div 
                      className="w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-2xl"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 200,
                        damping: 10
                      }}
                    >
                      <CheckCircle className="w-16 h-16 text-green-600" />
                    </motion.div>

                    <div className="space-y-6">
                      <motion.h1 
                        className="text-4xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      >
                        ¡Impresión Completada!
                      </motion.h1>
                      <motion.p 
                        className="text-gray-600 text-xl"
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                      >
                        Se han impreso exitosamente {constanciasGeneradas.length} constancia{constanciasGeneradas.length !== 1 ? 's' : ''}
                      </motion.p>
                    </div>

                    <motion.div
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.7 }}
                    >
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg rounded-xl">
                        <div className="p-8">
                          <div className="space-y-4">
                            <h3 className="text-green-800 text-xl font-medium">Constancias generadas:</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {constanciasGeneradas.map((constancia, index) => (
                                <motion.div
                                  key={index}
                                  className="flex items-center justify-between space-x-3 p-3 bg-white/50 rounded-lg"
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                                >
                                  <div className="flex items-center space-x-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="text-green-700 font-medium">{constancia.nombre}</span>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <div className="space-y-6">
                      <motion.div 
                        className="p-6 bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 rounded-xl"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 1.2 }}
                      >
                        <div className="flex items-start space-x-3">
                          <Sparkles className="w-6 h-6 text-blue-600 mt-1" />
                          <div className="space-y-2">
                            <p className="text-blue-800 font-medium">
                              <strong>Importante:</strong> Recoge tus constancias de la bandeja de salida de la impresora antes de retirarte.
                            </p>
                            <p className="text-blue-600 text-sm">
                              Regresando al inicio automáticamente en: <span className="font-bold text-lg">{tiempoRestante}</span> segundos
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 1.4 }}
                      >
                        <button
                          onClick={handleVolverInicio}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-12 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 w-full rounded-xl flex items-center justify-center"
                        >
                          <Home className="w-5 h-5 mr-3" />
                          Regresar al Inicio
                        </button>
                      </motion.div>
                      

                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}