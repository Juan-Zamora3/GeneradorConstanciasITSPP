import React, { useState, useRef , useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { db } from "../servicios/firebaseConfig"; // Ruta a tu config
import { collection, getDocs, doc, getDoc } from "firebase/firestore";


export default function Constancias() {
  const [plantillaPDF, setPlantillaPDF] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const fileInputRef = useRef(null);
  const [cursos, setCursos] = useState([]);
  const [participantes, setParticipantes] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState("");
  const [equiposSeleccionados, setEquiposSeleccionados] = useState({});
  const [seleccionados, setSeleccionados] = useState({});
  const toggleSeleccion = (index) => {
    setSeleccionados((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  useEffect(() => {
    const obtenerCursos = async () => {
      const cursosSnapshot = await getDocs(collection(db, "Cursos"));
      const listaCursos = cursosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCursos(listaCursos);
    };
  
    obtenerCursos();
  }, []);

  
  const handleSeleccionCurso = async (e) => {
    const cursoId = e.target.value;
    setCursoSeleccionado(cursoId);
  
    const docRef = doc(db, "Cursos", cursoId);
    const docSnap = await getDoc(docRef);
  
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.asistencia && data.asistencia.length > 0) {
        setParticipantes(data.asistencia[0].estudiantes || []);
      } else {
        setParticipantes([]);
      }
    }
  };
  


  
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        setTotalPages(pdfDoc.getPageCount());
        setPlantillaPDF(arrayBuffer);
  
        // Vista previa automática al cargar
        const blob = new Blob([arrayBuffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error al cargar el PDF:", error);
      }
    }
  };

  const handleGenerarConstancias = async () => {
    if (!plantillaPDF) {
      alert("Primero sube una plantilla PDF.");
      return;
    }
  
    const pdfDoc = await PDFDocument.load(plantillaPDF);
  
    // Filtrar seleccionados
    const seleccionadosArray = participantes.filter((_, i) => seleccionados[i]);
  
    // Si no hay seleccionados, detenemos
    if (seleccionadosArray.length === 0) {
      alert("Selecciona al menos un participante.");
      return;
    }
  
    // Aquí podrías agregar texto en el PDF por cada participante (si usas pdf-lib con fuentes y drawText)
    // Por ahora mostramos solo la vista previa del primero (como ejemplo)
  
    const blob = new Blob([plantillaPDF], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setCurrentPage(1);
  
    // Opción para descarga automática (si quieres)
    const link = document.createElement("a");
    link.href = url;
    link.download = "constancias.pdf";
    link.click();
  };

  const handleVisualizarPlantilla = async () => {
    if (!plantillaPDF) {
      alert("Primero sube una plantilla PDF.");
      return;
    }
  
    const pdfDoc = await PDFDocument.load(plantillaPDF);
  
    // Mostrar vista previa (sin descargar)
    const blob = new Blob([plantillaPDF], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setCurrentPage(1);
  };
  const handleCargarYVisualizar = () => {
    fileInputRef.current?.click(); // Abrir selector de archivos
  };
  

 return (
  // Contenedor principal de dos paneles: configuración (izquierda) y vista previa (derecha)
  <div className="flex h-screen">
    
    {/* === PANEL IZQUIERDO: CONFIGURACIÓN === */}
    <div className="w-[400px] min-w-[320px] bg-gray-50 p-5 overflow-y-auto h-full">
      <div className="space-y-6">
        
        {/* === 1. Subida de Plantilla PDF === */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800">Plantilla PDF</h3>
          <button
    onClick={handleCargarYVisualizar}
  className={`w-full px-4 py-2 rounded transition text-white ${
    plantillaPDF ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'
  }`}
>
  {plantillaPDF ? "Plantilla cargada " : "Cargar Plantilla"}
  
            </button>
          <input
            ref={fileInputRef} // Referencia al input para controlarlo manualmente
            type="file"
            accept=".pdf" // Solo permite archivos PDF
            className="hidden"
            onChange={handleFileChange} // Llama a función que lee el PDF
          />
        </div>

        {/* === 2. Selector de Evento === */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800">Seleccionar Evento</h3>
          <select
  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
  onChange={handleSeleccionCurso}
  value={cursoSeleccionado}
>
  <option value="">Seleccionar</option>
  {cursos.map((curso) => (
    <option key={curso.id} value={curso.id}>
      {curso.asistencia?.[0]?.cursoNombre || "Curso sin nombre"}
    </option>
  ))}
</select>


        </div>

        {/* === 3. Tipo de Constancia === */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800">Tipo de constancia</h3>
          <select className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
            <option value="">Seleccionar</option>
            {/* Aquí deberías mapear 'equipos', 'coordinadores', etc. */}
          </select>
        </div>

        {/* === 4. Lista de Equipos === */}
        {cursoSeleccionado && participantes.length > 0 ? (
  <div className="mt-2">
    <h4 className="text-md font-semibold text-gray-700 mb-2">Participantes</h4>

    <div className="overflow-x-auto rounded-lg border border-gray-300">
      <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
        <thead className="bg-purple-200 text-purple-800">
          <tr>
            <th className="px-4 py-2">Seleccionar</th>
            <th className="px-4 py-2">Nombre</th>
            <th className="px-4 py-2">Puesto</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {participantes.map((p, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-2">
                <input
                  type="checkbox"
                  checked={!!seleccionados[index]}
                  onChange={() => toggleSeleccion(index)}
                  className="form-checkbox text-purple-600"
                />
              </td>
              <td className="px-4 py-2">
                {p.Nombres} {p.ApellidoP} {p.ApellidoM}
              </td>
              <td className="px-4 py-2">{p.Puesto}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
) : (
  <p className="text-gray-500 mt-2">Selecciona un curso para ver a los participantes</p>
)}


        {/* === 5. Mensaje Personalizado === */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800">Mensaje personalizado</h3>
          <textarea
            className="w-full p-3 border border-gray-300 rounded resize-none focus:ring-2 focus:ring-blue-500"
            rows="4"
            placeholder="Por su valiosa participación en el concurso..."
            // value y onChange para manejar el texto
          ></textarea>
        </div>

        {/* === 6. Checkbox: Enviar por correo === */}
        <div className="flex items-center space-x-2">
          <input type="checkbox" className="form-checkbox text-blue-600" />
          <span className="text-gray-700">Enviar por correo</span>
        </div>

        {/* === 7. Botón: Generar Constancias === */}
        <button
  onClick={handleGenerarConstancias}
  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
>
  Generar Constancias
      </button>
      </div>
    </div>

    {/* === PANEL DERECHO: PREVISUALIZACIÓN DEL PDF === */}
    <div className="flex-1 bg-gray-100 flex flex-col p-5 h-full overflow-y-auto">
      {previewUrl ? (
        <div className="flex flex-col min-h-full">
          
          {/* Visor PDF con iframe */}
          <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden">
            <iframe
              src={`${previewUrl}#page=${currentPage}`} // Cambia según página actual
              title="PDF Preview"
              className="w-full h-full"
            />
          </div>

          {/* Navegación entre páginas del PDF */}
          <div className="flex items-center justify-between mb-2 sticky top-0 bg-gray-100 z-10">
            <div className="flex items-center space-x-4">
              {/* Botón Anterior */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="w-10 h-10 text-lg bg-blue-500 text-white rounded-full flex items-center justify-center hover:opacity-80 disabled:opacity-50 transition-opacity"
              >
                ←
              </button>

              {/* Indicador de página */}
              <span>
                Página {currentPage} de {totalPages}
              </span>

              {/* Botón Siguiente */}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="w-10 h-10 text-lg bg-blue-500 text-white rounded-full flex items-center justify-center hover:opacity-80 disabled:opacity-50 transition-opacity"
              >
                →
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Mensaje cuando no hay PDF cargado
        <div className="h-full flex items-center justify-center text-gray-400">
          Sube una plantilla PDF para previsualizar
        </div>
      )}
    </div>
  </div>
);

}
