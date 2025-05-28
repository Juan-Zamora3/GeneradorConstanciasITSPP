// src/paginas/Constancias.jsx
import React, { useState, useRef } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { db } from "../servicios/firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useCourses } from '../utilidades/useCourses';
import EnviarCorreo from '../componentes/EnviarCorreo.jsx';
import AttendanceModal from '../componentes/AttendanceModal';

export default function Constancias() {
  // 1) Cursos disponibles
  const { courses: cursos } = useCourses();

  // 2) Estado de selección y datos
  const [selectedCurso, setSelectedCurso]             = useState("");
  const [participantes, setParticipantes]             = useState([]);
  const [checkedParticipantes, setCheckedParticipantes] = useState({});
  const [mensajePersonalizado, setMensajePersonalizado] = useState("");
  const [sendByEmail, setSendByEmail]                 = useState(false);
  const [plantillaPDF, setPlantillaPDF]               = useState(null);
  const fileInputRef                                  = useRef(null);

  // 3) Previsualización de PDF
  const [pdfPreviews, setPdfPreviews]                 = useState([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [loadingPreviews, setLoadingPreviews]         = useState(false);
  const [progress, setProgress]                       = useState(0);

  // 4) Asistencias reales + modal
  const [asistenciasList, setAsistenciasList]         = useState([]);
  const [showRealList, setShowRealList]               = useState(false);
  const [showAttModal, setShowAttModal]               = useState(false);
  const [selectedAtt, setSelectedAtt]                 = useState(null);

  // A) Selección de curso
  const handleSeleccionCurso = async e => {
    const cursoId = e.target.value;
    setSelectedCurso(cursoId);

    // Cargo el documento de curso
    const cursoRef = doc(db, "Cursos", cursoId);
    const snap = await getDoc(cursoRef);
    if (!snap.exists()) {
      setParticipantes([]);
      setCheckedParticipantes({});
      setAsistenciasList([]);
      return;
    }
    const data = snap.data();

    // Cargo participantes iniciales
    let ids = Array.isArray(data.listas?.[0])
      ? data.listas[0]
      : data.listas || [];
    const alumnosSnap = await getDocs(collection(db, "Alumnos"));
    const alumnosAll = alumnosSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const cursoParts = alumnosAll.filter(a => ids.includes(a.id));
    setParticipantes(cursoParts);
    setCheckedParticipantes(
      cursoParts.reduce((acc, _, i) => ({ ...acc, [i]: true }), {})
    );

    // Cargo asistencias reales (campo array en el doc)
    setAsistenciasList(data.asistencias || []);
  };

  // B) Subida de plantilla PDF
  const handlePlantillaUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    if (String.fromCharCode(...new Uint8Array(buf.slice(0,5))) !== '%PDF-') {
      alert("El archivo no es un PDF válido");
      return;
    }
    setPlantillaPDF(buf);
  };

  // C) Generar vistas previas
  const generatePreviewsForSelectedParticipantes = async () => {
    if (!plantillaPDF) return alert("Sube primero la plantilla");
    const sel = participantes.filter((_,i) => checkedParticipantes[i]);
    if (sel.length === 0) return alert("Selecciona al menos un participante");

    setLoadingPreviews(true);
    setPdfPreviews([]); setCurrentPreviewIndex(0); setProgress(0);

    const blobs = [];
    for (let i = 0; i < sel.length; i++) {
      const bytes = await generarPDFpara(sel[i], plantillaPDF, mensajePersonalizado);
      blobs.push(URL.createObjectURL(new Blob([bytes], { type: "application/pdf" })));
      setProgress(Math.round(((i+1)/sel.length)*100));
    }
    setPdfPreviews(blobs);
    setTimeout(() => setLoadingPreviews(false), 300);
  };

  // D) Descargar ZIP de constancias
  const handleGenerarConstancias = async () => {
    if (!plantillaPDF) return alert("Sube primero la plantilla");
    const sel = participantes.filter((_,i) => checkedParticipantes[i]);
    if (sel.length === 0) return alert("Selecciona al menos un participante");

    const zip = new JSZip();
    for (const p of sel) {
      const bytes = await generarPDFpara(p, plantillaPDF, mensajePersonalizado);
      const name = `Constancia_${p.Nombres}_${p.ApellidoP}_${p.ApellidoM}`
        .replace(/\s+/g,'_')
        .replace(/[^\w\-\.]/g,'');
      zip.file(name + '.pdf', bytes);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "Constancias.zip");
  };

  // E) Función PDF-lib
  const generarPDFpara = async (participante, pdfTemplate, mensaje) => {
    const pdfDoc = await PDFDocument.load(pdfTemplate);
    pdfDoc.registerFontkit(fontkit);
    const fontReg  = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();

    const nombre = `${participante.Nombres} ${participante.ApellidoP} ${participante.ApellidoM}`
      .trim()
      .toUpperCase();

    // Dibujo del nombre
    const sizeName = 24;
    const nameW = fontBold.widthOfTextAtSize(nombre, sizeName);
    const xName = (width - nameW)/2.6;
    const yName = height/2 + 50;
    page.drawText(nombre, {
      x: xName, y: yName, size: sizeName,
      font: fontBold, color: rgb(0.29,0.29,0.29)
    });
    page.drawLine({
      start: { x: xName, y: yName - 4 },
      end:   { x: xName + nameW, y: yName - 4 },
      thickness: 1, color: rgb(0.29,0.29,0.29)
    });

    // Dibujo del mensaje
    if (mensaje.trim()) {
      const fontSize = 13.5;
      const maxW = width * 0.8;
      const words = mensaje.split(/\s+/);
      const lines = [];
      let line = "";

      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (fontReg.widthOfTextAtSize(test, fontSize) <= maxW) {
          line = test;
        } else {
          lines.push(line);
          line = w;
        }
      }
      if (line) lines.push(line);

      let cursorY = yName - sizeName - 12;
      for (const l of lines) {
        const w = fontReg.widthOfTextAtSize(l, fontSize);
        const x = (width - w)/2.6;
        page.drawText(l, {
          x, y: cursorY,
          size: fontSize, font: fontReg,
          color: rgb(0.2,0.2,0.2)
        });
        cursorY -= 18.5;
      }
    }

    return await pdfDoc.save();
  };

  // F) Helpers UI
  const prevPreview = () =>
    setCurrentPreviewIndex(i => Math.max(0, i-1));
  const nextPreview = () =>
    setCurrentPreviewIndex(i => Math.min(pdfPreviews.length-1, i+1));

  // Render
  return (
    <div className="flex h-full">

      {/* PANEL IZQUIERDO */}
      <div className="w-[400px] min-w-[320px] bg-gray-50 p-5 overflow-y-auto flex flex-col">

        {/* Plantilla PDF */}
        <div className="space-y-4 mb-6">
          <h3 className="flex justify-between items-center text-lg font-medium text-gray-800">
            <span>Plantilla PDF</span>
            <button
              onClick={generatePreviewsForSelectedParticipantes}
              className="inline-flex items-center text-green-600 hover:text-green-800"
            >
              {/* icono recargar */}
              <svg className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
              </svg>
              Recargar
            </button>
          </h3>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {plantillaPDF ? "Plantilla cargada" : "Cargar Plantilla"}
          </button>
          <input
            type="file" accept=".pdf"
            ref={fileInputRef}
            className="hidden"
            onChange={handlePlantillaUpload}
          />
        </div>

        {/* Selector de Evento */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-medium text-gray-800">Seleccionar Evento</h3>
          <select
            value={selectedCurso}
            onChange={handleSeleccionCurso}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled hidden>Seleccionar</option>
            {cursos.map(c => (
              <option key={c.id} value={c.id}>
                {c.titulo || "Sin título"}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle Listas */}
        <div className="mb-4">
          <button
            onClick={() => setShowRealList(s => !s)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            {showRealList
              ? "Ver Participantes Iniciales"
              : "Ver Asistencias Registradas"}
          </button>
        </div>

        {/* TABLA SIEMPRE VISIBLE */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-700 mb-2">
            {showRealList ? "Asistencias Registradas" : "Participantes (inicial)"}
          </h4>
          <div className="max-h-40 overflow-y-auto border rounded">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-purple-200 text-purple-800">
                <tr>
                  {!showRealList && <th className="px-4 py-2">Sel</th>}
                  <th className="px-4 py-2">Nombre</th>
                  <th className="px-4 py-2">Puesto</th>
                  {showRealList && <th className="px-4 py-2">Acción</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {showRealList
                  ? (
                    asistenciasList.map((a, idx) => {
                      const date = a.timestamp?.toDate
                        ? a.timestamp.toDate()
                        : new Date(a.timestamp);
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            {a.nombre}
                          </td>
                          <td className="px-4 py-2">
                            {a.puesto}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => { setSelectedAtt(a); setShowAttModal(true); }}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Ver foto
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    participantes.map((p,i) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={!!checkedParticipantes[i]}
                            onChange={() =>
                              setCheckedParticipantes(old => ({
                                ...old, [i]: !old[i]
                              }))
                            }
                          />
                        </td>
                        <td className="px-4 py-2">
                          {p.Nombres} {p.ApellidoP} {p.ApellidoM}
                        </td>
                        <td className="px-4 py-2">
                          {p.Puesto}
                        </td>
                      </tr>
                    ))
                  )
                }
                {/* fila placeholder si no hay datos */}
                {!showRealList && participantes.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-center text-gray-500">
                      Selecciona un evento para ver participantes
                    </td>
                  </tr>
                )}
                {showRealList && asistenciasList.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-center text-gray-500">
                      No hay asistencias registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mensaje personalizado */}
        <div className="space-y-2 mb-6">
          <h3 className="text-lg font-medium text-gray-800">
            Mensaje personalizado
          </h3>
          <textarea
            rows="4"
            className="w-full p-3 border rounded resize-none focus:ring-2 focus:ring-blue-500"
            placeholder="Mensaje para el PDF…"
            value={mensajePersonalizado}
            onChange={e => setMensajePersonalizado(e.target.value)}
          />
        </div>

        {/* Enviar por correo */}
        <div className="flex items-center mb-6 space-x-2">
          <input
            type="checkbox"
            className="form-checkbox text-blue-600"
            checked={sendByEmail}
            onChange={() => setSendByEmail(s => !s)}
          />
          <label className="text-gray-700 select-none">Enviar por correo</label>
          {sendByEmail && (
            <EnviarCorreo
              participantes={participantes.filter((_, i) => checkedParticipantes[i])}
              plantillaPDF={plantillaPDF}
              mensajePersonalizado={mensajePersonalizado}
              onClose={() => setSendByEmail(false)}
            />
          )}
        </div>

        {/* Botón Generar Constancias */}
        <button
          onClick={handleGenerarConstancias}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
        >
          Generar Constancias
        </button>
      </div>

      {/* PANEL DERECHO: Previews */}
      <div className="flex-1 bg-gray-100 p-5 flex flex-col">
        {pdfPreviews.length > 0 && (
          <div className="flex justify-center items-center mb-4 space-x-4">
            <button
              onClick={prevPreview}
              disabled={currentPreviewIndex === 0}
              className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              ← Anterior
            </button>
            <span className="font-medium text-gray-700">
              {currentPreviewIndex + 1} / {pdfPreviews.length}
            </span>
            <button
              onClick={nextPreview}
              disabled={currentPreviewIndex === pdfPreviews.length - 1}
              className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Siguiente →
            </button>
          </div>
        )}

        {pdfPreviews.length > 0 ? (
          <iframe
            src={pdfPreviews[currentPreviewIndex]}
            className="flex-1 border rounded"
            title="Vista previa PDF"
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Aquí aparecerá la vista previa…
          </div>
        )}
      </div>

      {/* Modal de asistencia real */}
      {showAttModal && (
        <AttendanceModal
          asistencia={selectedAtt}
          onClose={() => setShowAttModal(false)}
        />
      )}
    </div>
  );
}
