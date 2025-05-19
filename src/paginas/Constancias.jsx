import React, { useState, useRef } from "react";
import { PDFDocument } from "pdf-lib";

export default function Constancias() {
  const [plantillaPDF, setPlantillaPDF] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        setTotalPages(pdfDoc.getPageCount());
        setPlantillaPDF(arrayBuffer);

        const blob = new Blob([arrayBuffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error al cargar el PDF:", error);
      }
    }
  };

  return (
    <div className="flex h-screen">
      {/* Panel de Configuración (Izquierda) */}
      <div className="w-[400px] min-w-[320px] bg-gray-50 p-5 overflow-y-auto h-full">
        {" "}
        <div className="space-y-6">
          {/* Plantilla PDF */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Plantilla PDF</h3>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              Cargar Plantilla
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Selector de Evento */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">
              Seleccionar Evento
            </h3>
            <select className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
              <option value="">Seleccionar</option>
            </select>
          </div>

          {/* Tipo de constancia */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">
              Tipo de constancia
            </h3>
            <select className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
              <option value="">Seleccionar</option>
            </select>
          </div>

          {/* Equipos */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Equipos</h3>
            <div className="bg-purple-100 rounded-lg p-4">
              <div className="flex justify-between items-center text-sm font-medium text-purple-900">
                <span>Equipo</span>
                <span># Integrantes</span>
              </div>
              <div className="mt-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="form-checkbox text-purple-600"
                  />
                  <span>Equipo</span>
                  <span className="ml-auto">#</span>
                </label>
              </div>
            </div>
          </div>

          {/* Mensaje personalizado */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">
              Mensaje personalizado
            </h3>
            <textarea
              className="w-full p-3 border border-gray-300 rounded resize-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Por su valiosa participación en el concurso..."
            ></textarea>
          </div>

          {/* Enviar por correo */}
          <div className="flex items-center space-x-2">
            <input type="checkbox" className="form-checkbox text-blue-600" />
            <span className="text-gray-700">Enviar por correo</span>
          </div>

          {/* Botón Generar */}
          <button className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
            Generar Constancias
          </button>
        </div>
      </div>

      {/* Previsualizador (Derecha) */}
      <div className="flex-1 bg-gray-100 flex flex-col p-5 h-full overflow-y-auto">
        {previewUrl ? (
          <div className="flex flex-col min-h-full">
            <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden">
              {" "}
              <iframe
                src={`${previewUrl}#page=${currentPage}`}
                title="PDF Preview"
                className="w-full h-full"
              />
            </div>
            <div className="flex items-center justify-between mb-2 sticky top-0 bg-gray-100 z-10">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="w-10 h-10 text-lg bg-blue-500 text-white rounded-full flex items-center justify-center hover:opacity-80 disabled:opacity-50 transition-opacity"
                >
                  ←
                </button>
                <span>
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage >= totalPages}
                  className="w-10 h-10 text-lg bg-blue-500 text-white rounded-full flex items-center justify-center hover:opacity-80 disabled:opacity-50 transition-opacity"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            Sube una plantilla PDF para previsualizar
          </div>
        )}
      </div>
    </div>
  );
}
