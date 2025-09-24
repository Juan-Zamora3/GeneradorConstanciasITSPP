import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { IoMdArrowRoundBack } from "react-icons/io";
import { MdReceipt, MdPayment, MdCancel, MdPrint, MdAttachMoney, MdPerson } from "react-icons/md";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, FileText, Coins, CheckCircle, Loader2, DollarSign, Sparkles } from "lucide-react";
import itsppLogo from '../assets/logo.png';

export default function ConfirmarPago() {
  const navigate = useNavigate();
  const { cursoId, equipoId } = useParams();
  const location = useLocation();
  const { constancias, equipo, curso } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('waiting');
  const [coinsInserted, setCoinsInserted] = useState(0);
  const [progress, setProgress] = useState(0);

  // Cálculos de factura
  const precioPorConstancia = 30; // Precio base por constancia
  const subtotal = constancias?.length * precioPorConstancia || 0;
  // Eliminamos el IVA como solicitado
  const total = subtotal;
  const numeroFactura = `FACT-${Date.now()}`;
  const fechaFactura = new Date().toLocaleDateString('es-ES');

  const handleGoBack = () => {
    navigate(`/editar-constancias/${cursoId}/${equipoId}`, {
      state: { 
        integrantesSeleccionados: constancias?.map(c => ({ nombre: c.nombre, email: c.email })),
        equipo,
        curso
      }
    });
  };

  const handleStartPayment = () => {
    setShowPaymentDialog(true);
    setPaymentStatus('waiting');
    setCoinsInserted(0);
    setProgress(0);
  };

  const simulatePayment = () => {
    setPaymentStatus('processing');
    
    // Simular inserción de monedas
    const interval = setInterval(() => {
      setCoinsInserted(prev => {
        const newAmount = prev + 5;
        const newProgress = (newAmount / total) * 100;
        setProgress(newProgress);
        
        if (newAmount >= total) {
          clearInterval(interval);
          setTimeout(() => {
            setPaymentStatus('completed');
            setTimeout(() => {
              setShowPaymentDialog(false);
              // Navegar directamente a la pantalla de impresión de constancias
              handleContinuar();
            }, 2000);
          }, 1000);
          return total;
        }
        return newAmount;
      });
    }, 800);
  };

  const handleContinuar = () => {
    // Navegar directamente a la pantalla de impresión de constancias
    navigate(`/imprimir-constancias/${cursoId}/${equipoId}`, {
      state: { 
        constancias,
        equipo,
        curso,
        factura: {
          numero: numeroFactura,
          fecha: fechaFactura,
          subtotal,
          total,
          pagoCompletado: true,
          fechaPago: new Date(),
          items: constancias?.map(c => ({
            descripcion: `Constancia - ${c.nombre}`,
            cantidad: 1,
            precio: precioPorConstancia
          }))
        }
      }
    });
  };

  const handleCancelar = () => {
    navigate(`/editar-constancias/${cursoId}/${equipoId}`, {
      state: { 
        integrantesSeleccionados: constancias?.map(c => ({ nombre: c.nombre, email: c.email })),
        equipo,
        curso
      }
    });
  };

  useEffect(() => {
    if (!constancias || !equipo || !curso) {
      navigate(`/equipos-curso/${cursoId}`);
      return;
    }
  }, [constancias, equipo, curso, cursoId, navigate]);

  if (!constancias || !equipo || !curso) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <motion.div 
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 flex items-center space-x-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="text-gray-700 font-medium">Cargando información...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 relative overflow-hidden flex flex-col">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl"
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.5, 1]
          }}
          transition={{ 
            duration: 16, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/10 to-cyan-400/10 rounded-full blur-3xl"
          animate={{ 
            rotate: [360, 0],
            scale: [1.4, 1, 1.4]
          }}
          transition={{ 
            duration: 20, 
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
                  className="border border-emerald-200 text-emerald-900 hover:bg-emerald-50 bg-white/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 p-3 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </motion.div>
              <div>
                <motion.h1 
                  className="text-3xl bg-gradient-to-r from-emerald-900 to-teal-700 bg-clip-text text-transparent"
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  Confirmación de Pago
                </motion.h1>
                <motion.p 
                  className="text-emerald-600"
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
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Order Summary - Takes 3 columns */}
          <motion.div 
            className="lg:col-span-3 overflow-y-auto"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="bg-white/80 backdrop-blur-xl border-emerald-200 shadow-xl overflow-hidden relative mb-6 rounded-xl">
              {/* Decorative gradient */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400"></div>
              
              <div className="p-6 border-b border-emerald-100">
                <div className="flex items-center space-x-3 text-emerald-900">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  >
                    <FileText className="w-6 h-6" />
                  </motion.div>
                  <span className="font-medium">Resumen del Pedido</span>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-emerald-50 rounded-xl">
                  <div className="text-sm">
                    <span className="text-emerald-600">Curso:</span>
                    <p className="text-emerald-900 font-medium">{curso.nombre}</p>
                  </div>
                  <div className="text-sm">
                    <span className="text-emerald-600">Equipo:</span>
                    <p className="text-emerald-900 font-medium">{equipo.nombre}</p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-emerald-900 mb-4 text-lg font-medium">Constancias a generar:</h4>
                  <div className="space-y-3">
                    {constancias.map((constancia, index) => {
                      const colors = [
                        'from-yellow-400 to-orange-500',
                        'from-blue-400 to-cyan-500',
                        'from-green-400 to-emerald-500',
                        'from-purple-400 to-violet-500'
                      ];
                      const color = colors[index % colors.length];
                      
                      return (
                        <motion.div 
                          key={index} 
                          className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-white to-emerald-50 border border-emerald-100 shadow-sm"
                          initial={{ opacity: 0, x: -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 bg-gradient-to-r ${color} rounded-full`}></div>
                            <span className="text-emerald-800 font-medium">{constancia.nombre}</span>
                          </div>
                          <div 
                            className="border border-emerald-300 text-emerald-700 font-medium px-3 py-1 rounded-full text-sm"
                          >
                            ${precioPorConstancia}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-100 to-teal-100 border-emerald-200 shadow-xl rounded-xl">
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Sparkles className="w-6 h-6 text-emerald-600" />
                    <h4 className="text-emerald-900 text-lg font-medium">Información importante:</h4>
                  </div>
                  <ul className="text-emerald-800 space-y-2 ml-9 text-sm">
                    <li className="flex items-start space-x-2">
                      <div className="w-1 h-1 bg-emerald-600 rounded-full mt-2"></div>
                      <span>Las constancias se imprimirán inmediatamente después del pago</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1 h-1 bg-emerald-600 rounded-full mt-2"></div>
                      <span>Asegúrate de recoger todas las constancias antes de retirarte</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1 h-1 bg-emerald-600 rounded-full mt-2"></div>
                      <span>Las constancias tienen validez oficial institucional</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1 h-1 bg-emerald-600 rounded-full mt-2"></div>
                      <span>No se realizan reembolsos una vez generadas las constancias</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Sidebar - Payment Summary */}
          <motion.div 
            className="lg:col-span-1 flex flex-col justify-center"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <motion.div className="bg-white/80 backdrop-blur-xl border-emerald-200 shadow-xl overflow-hidden relative mb-6 rounded-xl"></motion.div>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full opacity-50 -translate-y-10 translate-x-10"></div>
              
              <div className="p-6 border-b border-emerald-100">
                <div className="flex items-center space-x-3 text-emerald-900">
                  <motion.div
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
                    <CreditCard className="w-6 h-6" />
                  </motion.div>
                  <span className="font-medium">Total a Pagar</span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm p-3 bg-emerald-50 rounded-lg">
                    <span className="text-emerald-700">Constancias ({constancias.length})</span>
                    <span className="font-medium text-emerald-800">${subtotal.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl">
                    <span className="text-xl text-emerald-900">Total:</span>
                    <motion.span 
                      className="text-3xl text-emerald-900 font-bold"
                      animate={{ 
                        scale: [1, 1.05, 1],
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      ${total.toFixed(2)}
                    </motion.span>
                  </div>
                </div>

                <div className="pt-6 space-y-4">
                  <motion.div
                    whileHover={{ scale: 1.02, y: -3 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      onClick={handleStartPayment}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl flex items-center justify-center space-x-2"
                    >
                      <Coins className="w-5 h-5" />
                      <span>Proceder al Pago</span>
                    </button>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      onClick={handleCancelar}
                      className="w-full border border-emerald-200 text-emerald-900 hover:bg-emerald-50 shadow-lg py-3 rounded-xl"
                    >
                      Cancelar
                    </button>
                  </motion.div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-100 to-yellow-100 border-orange-200 shadow-lg rounded-xl">
                <div className="p-6">
                  <div className="flex items-start space-x-3">
                    <motion.div
                      animate={{ 
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Coins className="w-6 h-6 text-orange-600 mt-1" />
                    </motion.div>
                    <div className="text-xs text-orange-800">
                      <p className="font-medium mb-2">Métodos de pago aceptados:</p>
                      <div className="grid grid-cols-2 gap-1">
                        <p>• Monedas $1, $2</p>
                        <p>• Monedas $5, $10</p>
                        <p>• Billetes $20, $50</p>
                        <p>• Billetes $100</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
        </div>
      </main>

      {/* Payment Dialog */}
      {showPaymentDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <motion.div 
            className="max-w-md bg-white/90 backdrop-blur-xl border-emerald-200 rounded-xl shadow-2xl p-8"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-center text-emerald-900 text-xl font-bold mb-2">
              {paymentStatus === 'waiting' && 'Inserta las Monedas'}
              {paymentStatus === 'processing' && 'Procesando Pago...'}
              {paymentStatus === 'completed' && 'Pago Completado'}
            </h3>
            <p className="text-center text-gray-600 mb-6">
              {paymentStatus === 'waiting' && 'Inserta las monedas o billetes para completar tu pago'}
              {paymentStatus === 'processing' && 'Estamos procesando tu pago, por favor espera'}
              {paymentStatus === 'completed' && 'Tu pago ha sido procesado exitosamente'}
            </p>
            
            <div className="py-8 text-center space-y-8">
              {paymentStatus === 'waiting' && (
                <>
                  <motion.div 
                    className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto shadow-lg"
                    animate={{ 
                      scale: [1, 1.05, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Coins className="w-12 h-12 text-emerald-600" />
                  </motion.div>
                  <div className="space-y-3">
                    <p className="text-gray-700 text-lg">Total a pagar:</p>
                    <motion.p 
                      className="text-3xl text-emerald-900 font-bold"
                      animate={{ 
                        scale: [1, 1.1, 1],
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      ${total.toFixed(2)}
                    </motion.p>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <button
                      onClick={simulatePayment}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-3 shadow-lg rounded-xl"
                    >
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4" />
                        <span>Simular Inserción de Monedas</span>
                      </div>
                    </button>
                  </motion.div>
                </>
              )}

              {paymentStatus === 'processing' && (
                <>
                  <motion.div 
                    className="w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto shadow-lg"
                    animate={{ 
                      rotate: 360,
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                      scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
                    }}
                  >
                    <Loader2 className="w-12 h-12 text-blue-600" />
                  </motion.div>
                  <div className="space-y-6">
                    <p className="text-gray-700 text-lg">Insertado: ${coinsInserted.toFixed(2)} de ${total.toFixed(2)}</p>
                    <div className="space-y-2">
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-500">Procesando pago...</p>
                    </div>
                  </div>
                </>
              )}

              {paymentStatus === 'completed' && (
                <>
                  <motion.div 
                    className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 200,
                      damping: 10
                    }}
                  >
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </motion.div>
                  <p className="text-gray-700 text-lg">¡Gracias por tu pago!</p>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}