
import React, { useState, useRef , useEffect } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { db } from "../servicios/firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import JSZip from "jszip";
import { saveAs } from "file-saver";





export default function Constancias() {
 // 1) Estados generales
 const [cursos, setCursos] = useState([]);
const [selectedCurso, setSelectedCurso] = useState("");
const [participantes, setParticipantes] = useState([]);

// Carga de cursos al montar el componente
useEffect(() => {
  const loadCursos = async () => {
    const snap = await getDocs(collection(db, "Cursos"));
    const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setCursos(arr);
  };
  loadCursos();
}, []);
 // 2) Checkboxes de equipos
 const [checkedParticipantes, setCheckedParticipantes] = useState({});
 // Para coordinadores: cuál está seleccionado (radio)
const [selectedCoordId, setSelectedCoordId] = useState(null);
// Mensaje personalizado para coordinadores
const [mensajePersonalizado, setMensajePersonalizado] = useState('');


 // 3) Checkbox “Enviar por correo”
 const [sendByEmail, setSendByEmail] = useState(false);

 // 4) Previsualización
 const [pdfPreviews, setPdfPreviews] = useState([]);
 const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

 // 5) Para mostrar overlay mientras se envían correos
 const [loadingEmail, setLoadingEmail] = useState(false);

 // 6) Referencia para subir la plantilla
 const fileInputRef = useRef(null);
 
 const [loadingPreviews, setLoadingPreviews] = useState(false);
 const [progress, setProgress] = useState(0);

 const handleSeleccionCurso = async (e) => {
  const cursoId = e.target.value;
  setSelectedCurso(cursoId);

  // Obtenemos el doc de Cursos/cursoId
  const ref = doc(db, "Cursos", cursoId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    setParticipantes([]);
    setCheckedParticipantes({});
    return;
  }

  const data = snap.data();
  const lista = data.asistencia?.[0]?.estudiantes || [];
  setParticipantes(lista);

  // Marca todos los participantes recién cargados
  const checks = lista.reduce((acc, _, i) => {
    acc[i] = true;
    return acc;
  }, {});
  setCheckedParticipantes(checks);
};



 // ------------------------------------------------------------------
 // Cargar la plantilla PDF
 // ------------------------------------------------------------------
 
 const handlePlantillaUpload = async (e) => {
   const file = e.target.files[0];
   if (!file) return;

   try {
     const arrayBuffer = await file.arrayBuffer();
     // Verificar que realmente sea PDF
     const header = new Uint8Array(arrayBuffer.slice(0, 5));
     if (String.fromCharCode(...header) !== '%PDF-') {
       alert('El archivo no es un PDF válido');
       return;
     }
     setPlantillaPDF(arrayBuffer);
   } catch (err) {
     console.error('Error leyendo PDF:', err);
     alert('Error al procesar la plantilla PDF');
   }
 };

 // 1) Previsualización
// 1) Previsualización
const generatePreviewsForSelectedParticipantes = async () => {
  // Filtramos los participantes marcados
  const selectedItems = participantes.filter((_, idx) => checkedParticipantes[idx]);
  if (!plantillaPDF) {
    return alert("Por favor sube una plantilla PDF primero");
  }
  if (selectedItems.length === 0) {
    return alert("Selecciona al menos un participante");
  }

  // Limpiamos previas
  setPdfPreviews([]);
  setCurrentPreviewIndex(0);
  setLoadingPreviews(true);
  setProgress(0);

  const previewBlobs = [];
  const total = selectedItems.length;
  let count = 0;

  for (const p of selectedItems) {
    // generas el PDF con tu función
    const pdfBytes = await generarPDFpara(p, plantillaPDF, mensajePersonalizado);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    previewBlobs.push(URL.createObjectURL(blob));

    count++;
    setProgress(Math.round((count / total) * 100));
  }

  setPdfPreviews(previewBlobs);
  setTimeout(() => setLoadingPreviews(false), 500);
};

const handlePreviewConstancias = () => {
  const sel = participantes.filter((_, i) => seleccionados[i]);
  if (!plantillaPDF) return alert("Sube plantilla");
  if (sel.length === 0) return alert("Selecciona al menos uno");
  generatePreviews(sel);
};
 
 // Ensure useEffect triggers correctly on checkbox changes

 
 

 // ------------------------------------------------------------------
 // Generar TODAS las constancias => descarga ZIP + previsualización
 // + si “enviar por correo” está marcado, enviar correos también
 // ------------------------------------------------------------------
// 2) Generar ZIP y descarga
const handleGenerarConstancias = async () => {
  if (!plantillaPDF) {
    alert("Por favor, sube primero la plantilla PDF.");
    return;
  }

  // Obtener los participantes seleccionados
  const seleccionados = participantes.filter((_, i) => checkedParticipantes[i]);
  if (seleccionados.length === 0) {
    alert("Selecciona al menos un participante.");
    return;
  }

  const zip = new JSZip();

  for (const p of seleccionados) {
    const pdfBytes = await generarPDFpara(p, plantillaPDF, mensajePersonalizado);
    const nombreArchivo = `Constancia_${p.Nombres}_${p.ApellidoP}_${p.ApellidoM}.pdf`
      .replace(/\s+/g, "_")
      .replace(/[^\w\-\.]/g, ""); // Limpia caracteres especiales

    zip.file(nombreArchivo, pdfBytes);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, "Constancias.zip");
};






 // ------------------------------------------------------------------
 // Genera un PDF para un participante (código tal como en “pre”
 // ------------------------------------------------------------------
 const generarPDFpara = async (participante, pdfTemplate, mensajePersonalizado = "") => {
  // 1) Carga el PDF y registra fontkit
  const pdfDoc = await PDFDocument.load(pdfTemplate);
  pdfDoc.registerFontkit(fontkit);

  // 2) Embebe las fuentes base (Helvetica y Helvetica Bold)
  const fontReg  = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // 3) Prepara la página
  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();

  // 4) Construye el nombre
  const nombre = `${participante.Nombres} ${participante.ApellidoP} ${participante.ApellidoM}`.trim();
  
  // Parámetros de estilo
  const SIZE_NAME   = 24;
  const SIZE_TEXT   = 13.5;
  const LINE_HEIGHT = 18.5;
  const COLOR_NAME  = rgb(73/255,73/255,73/255);
  const COLOR_TEXT  = rgb(0.2,0.2,0.2);

  // 5) Dibuja el nombre centrado y subrayado
  const nameTXT = nombre.toUpperCase();
  const nameW   = fontBold.widthOfTextAtSize(nameTXT, SIZE_NAME);
  const nameX   = (width - nameW) / 2;
  const nameY   = (height / 2) + 50;
  page.drawText(nameTXT, {
    x: nameX,
    y: nameY,
    size: SIZE_NAME,
    font: fontBold,
    color: COLOR_NAME
  });
  page.drawLine({
    start: { x: nameX,        y: nameY - 4 },
    end:   { x: nameX + nameW, y: nameY - 4 },
    thickness: 1,
    color: COLOR_NAME
  });

  // 6) Dibuja el mensaje centrado con word-wrap
  if (mensajePersonalizado.trim()) {
    const palabras = mensajePersonalizado.trim().split(/\s+/);
    const lineas   = [];
    let   linea    = "";

    for (const palabra of palabras) {
      const prueba = linea ? `${linea} ${palabra}` : palabra;
      if (fontReg.widthOfTextAtSize(prueba, SIZE_TEXT) <= width * 0.8) {
        linea = prueba;
      } else {
        lineas.push(linea);
        linea = palabra;
      }
    }
    if (linea) lineas.push(linea);

    let cursorY = nameY - SIZE_NAME - 12;
    for (const l of lineas) {
      const w = fontReg.widthOfTextAtSize(l, SIZE_TEXT);
      const x = (width - w) / 2;
      page.drawText(l, {
        x,
        y: cursorY,
        size: SIZE_TEXT,
        font: fontReg,
        color: COLOR_TEXT
      });
      cursorY -= LINE_HEIGHT;
    }
  }

  // 7) Guarda y retorna
  return await pdfDoc.save();
};




 
 
 
 
 
 
 
 

 // ------------------------------------------------------------------
 // Enviar constancias por correo (lógica intacta de “post”)
 // ------------------------------------------------------------------
 const handleEnviarCorreos = async () => {
  if (!plantillaPDF) {
    alert('Por favor sube una plantilla PDF primero');
    return;
  }

  // Tomamos equipos/participantes marcados
  const selectedTeamsList = teams.filter(t => checkedTeams[t.id]);
  const allParticipants = [];
  selectedTeamsList.forEach(team => {
    team.integrantes.forEach(integ => {
      allParticipants.push({
        teamName: team.nombre,
        ...integ,
      });
    });
  });

  if (allParticipants.length === 0) {
    alert('No hay integrantes seleccionados para enviar correo');
    return;
  }

  setLoadingEmail(true);
  try {
    for (let i = 0; i < allParticipants.length; i++) {
      const p = allParticipants[i];
      // Solo enviamos si tiene correo
      if (!p.correo) continue;
      const pdfBytes = await generarPDFpara(p, plantillaPDF,tipoConstancia);
      const base64Pdf = arrayBufferToBase64(pdfBytes);

      // Petición al servidor
      const response = await fetch('http://localhost:3000/enviarConstancia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correo: p.correo,
          nombre: p.nombre,
          equipo: p.teamName,
          pdf: base64Pdf
        })
      });
      if (!response.ok) {
        console.error(`Error enviando correo a ${p.correo}`);
      }
    }
    alert('Correos enviados correctamente');
  } catch (error) {
    console.error('Error al enviar correos:', error);
    alert('Error al enviar correos');
  } finally {
    setLoadingEmail(false);
  }
};

 // ------------------------------------------------------------------
 // Función auxiliar para convertir ArrayBuffer a base64 (intacta)
 // ------------------------------------------------------------------
 const arrayBufferToBase64 = (buffer) => {
   let binary = '';
   const bytes = new Uint8Array(buffer);
   for (let i = 0; i < bytes.byteLength; i++) {
     binary += String.fromCharCode(bytes[i]);
   }
   return window.btoa(binary);
 };

 // ------------------------------------------------------------------
 // Navegación de previsualización (sin cambios)
 // ------------------------------------------------------------------
 const handleNextPreview = () => {
   if (pdfPreviews.length === 0) return;
   setCurrentPreviewIndex((prev) => (prev + 1) % pdfPreviews.length);
 };

 const handlePrevPreview = () => {
   if (pdfPreviews.length === 0) return;
   setCurrentPreviewIndex((prev) => (prev - 1 + pdfPreviews.length) % pdfPreviews.length);
 };

 // ------------------------------------------------------------------
 // Toggle de selección de equipo
 // ------------------------------------------------------------------
 const toggleCheckParticipantes = (ParticipantesId) => {
   setCheckedParticipantes(prev => {
     const newCheckedParticipantes = {
       ...prev,
       [ParticipantesId]: !prev[ParticipantesId]
     };
     return newCheckedParticipantes;
   });
 };

 const handleMensajeChange = (e) => {
   setMensajePersonalizado(e.target.value);
 };

 // al inicio del componente
 const [tipoConstancia, setTipoConstancia] = useState('Eventos');
 // Estado para almacenar el ArrayBuffer del PDF
const [plantillaPDF, setPlantillaPDF] = useState(null);


 
 
 



// justo después de tus otros useEffects:




// Cuando cambias de coordinador, carga su mensaje



// Y para guardar:
const handleMensajeBlur = async () => {
 if (!selectedCurso) return;

 // Decidir docId según el tipo
 let docId;
 if (tipoConstancia === 'coordinadores') {
   if (!selectedCoordId) return;
   docId = `coordinadores__${selectedCoordId}`;
 } else {
   docId = tipoConstancia; // 'equipos' o 'maestros'
 }

 try {
   const ref = doc(
     db,
     'eventos',
     selectedCurso,
     'configConstancias',
     docId
   );
   await setDoc(ref, { texto: mensajePersonalizado }, { merge: true });
 } catch (err) {
   console.error('Error guardando mensaje personalizado:', err);
 }
};

const applyFormat = (type) => {
 const textarea = document.querySelector('textarea');
 const start = textarea.selectionStart;
 const end = textarea.selectionEnd;
 const selectedText = mensajePersonalizado.slice(start, end);

 let formatted = selectedText;
 if (type === 'bold') formatted = `**${selectedText}**`;
 if (type === 'underline') formatted = `__${selectedText}__`;

 const updated =
   mensajePersonalizado.slice(0, start) +
   formatted +
   mensajePersonalizado.slice(end);

 setMensajePersonalizado(updated);

 // Mantener selección
 setTimeout(() => {
   textarea.focus();
   textarea.setSelectionRange(start, start + formatted.length);
 }, 0);
};
 // ------------------------------------------------------------------
 // Render principal
 // ------------------------------------------------------------------
  

 return (
  <div className="flex h-full">
    {/* PANEL IZQUIERDO */}
    <div className="w-[400px] min-w-[320px] bg-gray-50 p-5 overflow-y-auto flex flex-col justify-between">
      
      <div className="space-y-6">
         {/* Botón Recarga arriba de Plantilla */}
         
        {/* 1. Subida de Plantilla PDF */}
        <div className="space-y-4">
        <h3 className="flex justify-between items-center text-lg font-medium text-gray-800">
    <span>Plantilla PDF</span>
    <button
      onClick={generatePreviewsForSelectedParticipantes}
      className="inline-flex items-center text-green-600 hover:text-green-800"
    >
      {/* Icono SVG de recarga */}
      <svg
        className="h-5 w-5 mr-1"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4l5-5-5-5v4a10 10 0 100 20 10 10 0 000-20z"
        />
      </svg>
      Recargar
    </button>
  </h3>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`w-full px-4 py-2 rounded text-white transition ${
              plantillaPDF
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {plantillaPDF ? "Plantilla cargada" : "Cargar Plantilla"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handlePlantillaUpload}
          />
        </div>

        {/* 2. Selector de Evento */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800">Seleccionar Evento</h3>
          <select
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            value={selectedCurso}
            onChange={handleSeleccionCurso}
          >
            <option value="" disabled hidden>Seleccionar</option>
            {cursos.map(c => (
              <option key={c.id} value={c.id}>
                {c.asistencia?.[0]?.cursoNombre}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Tipo de constancia */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800">Tipo de constancia</h3>
          <select
            value={tipoConstancia}
            onChange={e => setTipoConstancia(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled hidden>Seleccionar</option>
            <option value="equipos">Equipos</option>
            <option value="coordinadores">Coordinadores</option>
            <option value="maestros">Maestros</option>
          </select>
        </div>

        {/* 4. Tabla de Participantes */}
        {participantes.length > 0 ? (
  <div>
    <h4 className="text-md font-semibold text-gray-700 mb-2">Participantes</h4>
    <div className="rounded-lg border border-gray-300 overflow-x-auto">
      {/* Contenedor de altura fija con scroll vertical */}
      <div className="max-h-60 overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
          <thead className="bg-purple-200 text-purple-800">
            <tr>
              <th className="px-4 py-2">Seleccionar</th>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Puesto</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {participantes.map((p, i) => (
              <tr key={p.id || i} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={!!checkedParticipantes[i]}
                    onChange={() =>
                      setCheckedParticipantes(old => ({
                        ...old,
                        [i]: !old[i],
                      }))
                    }
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
  </div>
) : (
  <p className="text-gray-500">Selecciona un evento para ver participantes</p>
)}


        {/* 5. Mensaje personalizado */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800">Mensaje personalizado</h3>
          <textarea
            className="w-full p-3 border border-gray-300 rounded resize-none focus:ring-2 focus:ring-blue-500"
            rows="4"
            placeholder="Por su valiosa participación en el concurso..."
            value={mensajePersonalizado}
            onChange={handleMensajeChange}
            onBlur={handleMensajeBlur}
          />
        </div>

        {/* 6. Enviar por correo */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            className="form-checkbox text-blue-600"
            checked={sendByEmail}
            onChange={() => setSendByEmail(!sendByEmail)}
          />
          <span className="text-gray-700">Enviar por correo</span>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="space-y-2">
        <button
          onClick={handleGenerarConstancias}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          Generar Constancias
        </button>
        
      </div>
    </div>

   
{/* PANEL DERECHO */}
<div className="flex-1 bg-gray-100 p-5 flex flex-col">
  {/* Navegación: sólo si hay previas */}
  {pdfPreviews.length > 0 && (
    <div className="flex justify-center items-center mb-4 space-x-4">
      <button
        onClick={() => setCurrentPreviewIndex(i => Math.max(0, i - 1))}
        disabled={currentPreviewIndex === 0}
        className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        ← Anterior
      </button>
      <span className="font-medium text-gray-700">
        {currentPreviewIndex + 1} / {pdfPreviews.length}
      </span>
      <button
        onClick={() => setCurrentPreviewIndex(i => Math.min(pdfPreviews.length - 1, i + 1))}
        disabled={currentPreviewIndex === pdfPreviews.length - 1}
        className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        Siguiente →
      </button>
    </div>
  )}

  {/* Área de preview */}
  {pdfPreviews.length > 0 ? (
    <div className="flex-1 border border-gray-300 rounded overflow-hidden">
      <iframe
        src={pdfPreviews[currentPreviewIndex]}
        className="w-full h-full"
        title="Vista previa PDF"
      />
    </div>
  ) : (
    <div className="flex-1 flex items-center justify-center text-gray-400">
      Aquí aparecerá la vista previa…
    </div>
  )}
</div>

  </div>
);
}
