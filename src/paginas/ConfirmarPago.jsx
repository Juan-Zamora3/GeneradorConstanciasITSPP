import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { IoMdArrowRoundBack } from "react-icons/io";
import { MdReceipt, MdPayment, MdCancel, MdPrint, MdAttachMoney, MdPerson } from "react-icons/md";
import itsppLogo from '../assets/logo.png';

export default function ConfirmarPago() {
  const navigate = useNavigate();
  const { cursoId, equipoId } = useParams();
  const location = useLocation();
  const { constancias, equipo, curso } = location.state || {};

  const [loading, setLoading] = useState(false);

  // Cálculos de factura
  const precioPorConstancia = 30; // Precio base por constancia
  const subtotal = constancias?.length * precioPorConstancia || 0;
  const iva = subtotal * 0.16;
  const total = subtotal + iva;
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

  const handleContinuar = () => {
    // Navegar a la pantalla de proceso de pago
    navigate(`/proceso-pago/${cursoId}/${equipoId}`, {
      state: { 
        constancias,
        equipo,
        curso,
        factura: {
          numero: numeroFactura,
          fecha: fechaFactura,
          subtotal,
          iva,
          total,
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-700 font-medium">Cargando información...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <button
              onClick={handleGoBack}
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200 group"
            >
              <IoMdArrowRoundBack className="w-6 h-6 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="font-medium">Volver a Edición</span>
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Confirmación de Pago</h1>
              <p className="text-sm text-gray-600 mt-1">
                {curso?.nombre} • {equipo?.nombre}
              </p>
            </div>
            <div className="w-32"></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Resumen de constancias */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-3">
              <MdPrint className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Resumen de Constancias</h2>
              <p className="text-gray-600">Revisa los detalles antes de proceder al pago</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Información del Curso
              </h3>
              <div className="space-y-2 text-gray-700">
                <p><span className="font-semibold">Curso:</span> {curso.nombre}</p>
                <p><span className="font-semibold">Instructor:</span> {curso.instructor}</p>
                <p><span className="font-semibold">Equipo:</span> {equipo.nombre}</p>
                <p><span className="font-semibold">Categoría:</span> {equipo.categoria}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Constancias a Generar
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {constancias.map((constancia, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <MdPerson className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-800">{constancia.nombre}</span>
                    </div>
                    <span className="text-green-600 font-bold">${precioPorConstancia}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Factura directa en la página */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img src={itsppLogo} alt="ITSPP Logo" className="w-12 h-12" />
                <div>
                  <h3 className="text-2xl font-bold text-white">Factura</h3>
                  <p className="text-blue-100">Instituto Tecnológico Superior de Puerto Peñasco</p>
                </div>
              </div>
              <div className="text-right text-white">
                <p className="text-sm opacity-90">No. {numeroFactura}</p>
                <p className="text-sm opacity-90">{fechaFactura}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="space-y-6">
              {/* Información del cliente */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Información del Servicio</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="font-semibold">Curso:</span> {curso?.nombre}</p>
                    <p><span className="font-semibold">Equipo:</span> {equipo?.nombre}</p>
                  </div>
                  <div>
                    <p><span className="font-semibold">Instructor:</span> {curso?.instructor}</p>
                    <p><span className="font-semibold">Categoría:</span> {equipo?.categoria}</p>
                  </div>
                </div>
              </div>

              {/* Detalles de la factura */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4">Detalles del Servicio</h4>
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descripción
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cantidad
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Precio
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {constancias.map((constancia, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              Constancia de Participación
                            </div>
                            <div className="text-sm text-gray-500">
                              {constancia.nombre}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            1
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                            ${precioPorConstancia}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totales */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal:</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>IVA (16%):</span>
                    <span className="font-medium">${iva.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex justify-between text-xl font-bold text-gray-900">
                      <span>Total:</span>
                      <span className="text-green-600">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex space-x-4 justify-center">
          <button
            onClick={handleCancelar}
            className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
          >
            <div className="flex items-center space-x-2">
              <MdCancel className="w-5 h-5" />
              <span>Cancelar</span>
            </div>
          </button>
          <button
            onClick={handleContinuar}
            disabled={loading}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-200 font-bold disabled:opacity-50"
          >
            <div className="flex items-center space-x-2">
              <MdPayment className="w-5 h-5" />
              <span>{loading ? 'Procesando...' : 'Continuar con Transacción'}</span>
            </div>
          </button>
        </div>
      </div>


    </div>
  );
}