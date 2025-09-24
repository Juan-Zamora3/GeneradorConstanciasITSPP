import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { MdAttachMoney, MdCheckCircle, MdCancel } from "react-icons/md";
import itsppLogo from '../assets/logo.png';

export default function ProcesoPago() {
  const navigate = useNavigate();
  const { cursoId, equipoId } = useParams();
  const location = useLocation();
  const { constancias, equipo, curso, factura } = location.state || {};

  const [montoIngresado, setMontoIngresado] = useState(0);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [pagoCompletado, setPagoCompletado] = useState(false);
  const [animacionMoneda, setAnimacionMoneda] = useState(false);

  const montoRequerido = factura?.total || 0;
  const montoRestante = Math.max(0, montoRequerido - montoIngresado);

  const simularInsercionMoneda = (valor) => {
    setAnimacionMoneda(true);
    setTimeout(() => {
      setMontoIngresado(prev => prev + valor);
      setAnimacionMoneda(false);
    }, 500);
  };

  const handleCancelar = () => {
    navigate(`/confirmar-pago/${cursoId}/${equipoId}`, {
      state: { constancias, equipo, curso }
    });
  };

  const procesarPago = () => {
    setProcesandoPago(true);
    
    // Simular proceso de pago
    setTimeout(() => {
      setProcesandoPago(false);
      setPagoCompletado(true);
      
      // Después de 2 segundos, navegar a impresión
      setTimeout(() => {
        navigate(`/imprimir-constancias/${cursoId}/${equipoId}`, {
          state: { 
            constancias,
            equipo,
            curso,
            factura: {
              ...factura,
              pagoCompletado: true,
              fechaPago: new Date(),
              montoRecibido: montoIngresado
            }
          }
        });
      }, 2000);
    }, 3000);
  };

  useEffect(() => {
    if (!constancias || !equipo || !curso || !factura) {
      navigate(`/equipos-curso/${cursoId}`);
      return;
    }
  }, [constancias, equipo, curso, factura, cursoId, navigate]);

  useEffect(() => {
    if (montoIngresado >= montoRequerido && !procesandoPago && !pagoCompletado) {
      // Auto-procesar cuando se complete el monto
      setTimeout(() => {
        procesarPago();
      }, 1000);
    }
  }, [montoIngresado, montoRequerido, procesandoPago, pagoCompletado]);

  if (!constancias || !equipo || !curso || !factura) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-700 font-medium">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-20">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Proceso de Pago</h1>
              <p className="text-sm text-gray-600 mt-1">
                Inserte las monedas para completar la transacción
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!pagoCompletado ? (
          <>
            {/* Display principal */}
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img src={itsppLogo} alt="ITSPP Logo" className="w-12 h-12" />
                    <div>
                      <h2 className="text-2xl font-bold text-white">Terminal de Pago</h2>
                      <p className="text-green-100">Instituto Tecnológico Superior de Puerto Peñasco</p>
                    </div>
                  </div>
                  <div className="text-right text-white">
                    <p className="text-sm opacity-90">Factura: {factura.numero}</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                {/* Display de montos */}
                <div className="text-center mb-8">
                  <div className="bg-black rounded-2xl p-8 mb-6">
                    <div className="text-green-400 font-mono space-y-2">
                      <div className="text-lg">TOTAL A PAGAR:</div>
                      <div className="text-4xl font-bold">${montoRequerido.toFixed(2)}</div>
                      <div className="text-lg">INGRESADO:</div>
                      <div className={`text-3xl font-bold ${montoIngresado >= montoRequerido ? 'text-green-300' : 'text-yellow-300'}`}>
                        ${montoIngresado.toFixed(2)}
                      </div>
                      {montoRestante > 0 && (
                        <>
                          <div className="text-lg">RESTANTE:</div>
                          <div className="text-2xl font-bold text-red-400">${montoRestante.toFixed(2)}</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Indicador de progreso */}
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (montoIngresado / montoRequerido) * 100)}%` }}
                    ></div>
                  </div>

                  {procesandoPago ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Procesando Pago...</h3>
                      <p className="text-gray-600">Por favor espere mientras se confirma la transacción</p>
                    </div>
                  ) : montoIngresado >= montoRequerido ? (
                    <div className="text-center py-8">
                      <MdCheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-green-800 mb-2">¡Pago Completo!</h3>
                      <p className="text-gray-600">Procesando transacción...</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        Inserte Monedas
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Seleccione las denominaciones para completar el pago
                      </p>
                    </div>
                  )}
                </div>

                {/* Simulador de monedas */}
                {!procesandoPago && montoIngresado < montoRequerido && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 5, 10, 20, 50, 100, 200].map((valor) => (
                      <button
                        key={valor}
                        onClick={() => simularInsercionMoneda(valor)}
                        disabled={animacionMoneda}
                        className={`relative p-6 rounded-2xl border-2 transition-all duration-200 transform hover:scale-105 ${
                          animacionMoneda 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:shadow-lg border-gray-300 hover:border-green-500'
                        }`}
                      >
                        <div className="text-center">
                          <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg ${
                            valor >= 100 ? 'bg-gradient-to-br from-yellow-500 to-orange-600' :
                            valor >= 20 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                            'bg-gradient-to-br from-amber-600 to-yellow-700'
                          }`}>
                            ${valor}
                          </div>
                          <p className="text-sm font-medium text-gray-700">
                            {valor >= 20 ? 'Billete' : 'Moneda'}
                          </p>
                        </div>
                        
                        {animacionMoneda && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <MdAttachMoney className="w-8 h-8 text-green-600 animate-bounce" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Leyenda y botón cancelar */}
                {!procesandoPago && !pagoCompletado && (
                  <div className="text-center mt-8 space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <div className="flex items-center justify-center space-x-2 text-yellow-800">
                        <MdCancel className="w-5 h-5" />
                        <p className="text-sm font-medium">
                          <strong>Importante:</strong> Al cancelar la transacción no se puede reembolsar el dinero ya que la máquina no lo permite. Gracias por su consideración.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleCancelar}
                      className="px-8 py-3 border-2 border-red-300 text-red-700 rounded-xl hover:bg-red-50 transition-all duration-200 font-medium"
                    >
                      <div className="flex items-center space-x-2">
                        <MdCancel className="w-5 h-5" />
                        <span>Cancelar Transacción</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Pantalla de pago completado */
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-8 py-6">
              <div className="text-center">
                <MdCheckCircle className="w-16 h-16 text-white mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">¡Pago Exitoso!</h2>
                <p className="text-green-100">La transacción se ha completado correctamente</p>
              </div>
            </div>

            <div className="p-8 text-center">
              <div className="space-y-4 mb-8">
                <p className="text-lg text-gray-700">
                  <span className="font-semibold">Monto pagado:</span> ${montoIngresado.toFixed(2)}
                </p>
                <p className="text-lg text-gray-700">
                  <span className="font-semibold">Cambio:</span> ${(montoIngresado - montoRequerido).toFixed(2)}
                </p>
              </div>
              
              <div className="animate-pulse">
                <p className="text-xl font-bold text-gray-900">
                  Preparando constancias para impresión...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}