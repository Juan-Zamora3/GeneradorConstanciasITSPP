import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { MdPrint, MdDownload, MdCheckCircle, MdHome } from "react-icons/md";
import { PDFDocument, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
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
              <h1 className="text-2xl font-bold text-gray-900">Impresión de Constancias</h1>
              <p className="text-sm text-gray-600 mt-1">
                {curso?.nombre} • {equipo?.nombre}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {generandoPDFs ? (
          /* Pantalla de generación */
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Generando Constancias</h2>
                <p className="text-blue-100">Por favor espere mientras se preparan los documentos</p>
              </div>
            </div>

            <div className="p-8">
              <div className="text-center mb-8">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Generando PDFs...
                </h3>
                
                {/* Barra de progreso */}
                <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${progreso}%` }}
                  ></div>
                </div>
                
                <p className="text-gray-600">
                  {Math.round(progreso)}% completado ({Math.ceil((progreso / 100) * constancias.length)} de {constancias.length})
                </p>
              </div>
            </div>
          </div>
        ) : !impresionCompleta ? (
          /* Pantalla de impresión */
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-8 py-6">
              <div className="text-center">
                <MdPrint className="w-16 h-16 text-white mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Imprimiendo Constancias</h2>
                <p className="text-green-100">Las constancias se están enviando a la impresora</p>
              </div>
            </div>

            <div className="p-8 text-center">
              <div className="space-y-6">
                <div className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg h-4 w-3/4 mx-auto mb-4"></div>
                  <div className="bg-gray-200 rounded-lg h-4 w-1/2 mx-auto mb-4"></div>
                  <div className="bg-gray-200 rounded-lg h-4 w-2/3 mx-auto"></div>
                </div>
                
                <p className="text-lg text-gray-700">
                  Imprimiendo {constanciasGeneradas.length} constancia(s)...
                </p>
                
                <div className="flex justify-center">
                  <button
                    onClick={descargarTodas}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200"
                  >
                    <MdDownload className="w-5 h-5" />
                    <span>Descargar como Respaldo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Pantalla de finalización */
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-8 py-6">
              <div className="text-center">
                <MdCheckCircle className="w-20 h-20 text-white mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">¡Proceso Completado!</h2>
                <p className="text-green-100">Las constancias han sido generadas e impresas exitosamente</p>
              </div>
            </div>

            <div className="p-8">
              <div className="text-center space-y-6">
                <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                  <h3 className="text-xl font-bold text-green-800 mb-4">Resumen Final</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <p><span className="font-semibold">Curso:</span> {curso.nombre}</p>
                      <p><span className="font-semibold">Equipo:</span> {equipo.nombre}</p>
                      <p><span className="font-semibold">Constancias:</span> {constanciasGeneradas.length}</p>
                    </div>
                    <div className="space-y-2">
                      <p><span className="font-semibold">Total Pagado:</span> ${factura.total?.toFixed(2)}</p>
                      <p><span className="font-semibold">Fecha:</span> {new Date().toLocaleDateString('es-ES')}</p>
                      <p><span className="font-semibold">Factura:</span> {factura.numero}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                    <div className="text-center">
                      <p className="text-lg text-blue-800 mb-2">
                        Regresando al inicio automáticamente en:
                      </p>
                      <div className="text-4xl font-bold text-blue-600 mb-4">
                        {tiempoRestante}
                      </div>
                      <p className="text-sm text-blue-600">
                        segundos
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleVolverInicio}
                    className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-200 font-bold"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <MdHome className="w-5 h-5" />
                      <span>Volver al Inicio Ahora</span>
                    </div>
                  </button>
                </div>

                {/* Lista de constancias generadas */}
                <div className="mt-8">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Constancias Generadas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {constanciasGeneradas.map((constancia, index) => (
                      <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-gray-900">{constancia.nombre}</h5>
                            <p className="text-sm text-gray-600">
                              {constancia.nombre === equipo?.lider ? 'Líder' : 'Integrante'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MdCheckCircle className="w-5 h-5 text-green-600" />
                            <a
                              href={constancia.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <MdDownload className="w-5 h-5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}