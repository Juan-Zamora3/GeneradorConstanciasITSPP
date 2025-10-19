import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { IoMdArrowRoundBack } from "react-icons/io";
import { MdReceipt, MdPayment, MdCancel, MdPrint, MdAttachMoney, MdPerson } from "react-icons/md";
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
      <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-700 font-medium">Cargando información...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 relative overflow-hidden flex flex-col">
      {/* Fondo estático sin animaciones */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/10 to-blue-400/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg flex-shrink-0">
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
              <div>
                <h1 className="text-3xl bg-gradient-to-r from-blue-900 to-cyan-700 bg-clip-text text-transparent">
                  Confirmación de Pago
                </h1>
                <p className="text-blue-600">
                  {curso?.nombre} • {equipo?.nombre}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Order Summary - Takes 3 columns */}
          <div className="lg:col-span-3 overflow-y-auto">
            <div className="bg-white/80 backdrop-blur-xl border-blue-200 shadow-xl overflow-hidden relative mb-6 rounded-xl">
              {/* Decorative gradient */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400"></div>
              
              <div className="p-6 border-b border-blue-100">
                <div className="flex items-center space-x-3 text-blue-900">
                  <FileText className="w-6 h-6" />
                  <span className="font-medium">Resumen del Pedido</span>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl">
                  <div className="text-sm">
                    <span className="text-blue-600">Curso:</span>
                    <p className="text-blue-900 font-medium">{curso.nombre}</p>
                  </div>
                  <div className="text-sm">
                    <span className="text-blue-600">Equipo:</span>
                    <p className="text-blue-900 font-medium">{equipo.nombre}</p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-blue-900 mb-4 text-lg font-medium">Constancias a generar:</h4>
                  <div className="space-y-3">
                    {constancias.map((constancia, index) => {
                      const color = 'from-blue-400 to-cyan-500';
                      return (
                        <div 
                          key={index} 
                          className="flex justify_between items-center p-4 rounded-xl bg-gradient-to-r from-white to-blue-50 border border-blue-100 shadow-sm"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 bg-gradient-to-r ${color} rounded-full`}></div>
                            <span className="text-blue-800 font-medium">{constancia.nombre}</span>
                          </div>
                          <div 
                            className="border border-blue-300 text-blue-700 font-medium px-3 py-1 rounded-full text-sm"
                          >
                            ${precioPorConstancia}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-200 shadow-xl rounded-xl">
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Sparkles className="w-6 h-6 text-blue-600" />
                    <h4 className="text-blue-900 text-lg font-medium">Información importante:</h4>
                  </div>
                  <ul className="text-blue-800 space-y-2 ml-9 text-sm">
                    <li className="flex items-start space-x-2">
                      <div className="w-1 h-1 bg-blue-600 rounded-full mt-2"></div>
                      <span>Las constancias se imprimirán inmediatamente después del pago</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1 h-1 bg-blue-600 rounded-full mt-2"></div>
                      <span>Asegúrate de recoger todas las constancias antes de retirarte</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1 h-1 bg-blue-600 rounded-full mt-2"></div>
                      <span>Las constancias tienen validez oficial institucional</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1 h-1 bg-blue-600 rounded-full mt-2"></div>
                      <span>No se realizan reembolsos una vez generadas las constancias</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Payment Summary */}
          <div className="lg:col-span-1 flex flex-col justify-center">
            <div className="bg-white/80 backdrop-blur-xl border-blue-200 shadow-xl overflow-hidden relative mb-6 rounded-xl">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full opacity-50 -translate-y-10 translate-x-10"></div>
              
              <div className="p-6 border-b border-blue-100">
                <div className="flex items-center space-x-3 text-blue-900">
                  <CreditCard className="w-6 h-6" />
                  <span className="font-medium">Total a Pagar</span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-700">Constancias ({constancias.length})</span>
                    <span className="font-medium text-blue-800">${subtotal.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl">
                    <span className="text-xl text-blue-900">Total:</span>
                    <span className="text-3xl text-blue-900 font-bold">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="pt-6 space-y-4">
                  <button
                    onClick={handleStartPayment}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-4 text-lg shadow-xl transition-all duration-300 rounded-xl flex items-center justify-center space-x-2"
                  >
                    <Coins className="w-5 h-5" />
                    <span>Proceder al Pago</span>
                  </button>
                  
                  <button
                    onClick={handleCancelar}
                    className="w-full border border-blue-200 text-blue-900 hover:bg-blue-50 shadow-lg py-3 rounded-xl"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 shadow-lg rounded-xl">
              <div className="p-6">
                <div className="flex items-start space-x-3">
                  <Coins className="w-6 h-6 text-blue-600 mt-1" />
                  <div className="text-xs text-blue-800">
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
          </div>
        </div>
      </main>

      {/* Payment Dialog */}
      {showPaymentDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="max-w-md bg-white/90 backdrop-blur-xl border-blue-200 rounded-xl shadow-2xl p-8">
            <h3 className="text-center text-blue-900 text-xl font-bold mb-2">
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
                  <div className="w-24 h-24 bg-gradient_to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <Coins className="w-12 h-12 text-blue-600" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-gray-700 text-lg">Total a pagar:</p>
                    <p className="text-3xl text-blue-900 font-bold">
                      ${total.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={simulatePayment}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3 shadow-lg rounded-xl"
                  >
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4" />
                      <span>Simular Inserción de Monedas</span>
                    </div>
                  </button>
                </>
              )}

              {paymentStatus === 'processing' && (
                <>
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                  </div>
                  <div className="space-y-6">
                    <p className="text-gray-700 text-lg">Insertado: ${coinsInserted.toFixed(2)} de ${total.toFixed(2)}</p>
                    <div className="space-y-2">
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
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
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <CheckCircle className="w-12 h-12 text-blue-600" />
                  </div>
                  <p className="text-gray-700 text-lg">¡Gracias por tu pago!</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}