// src/paginas/Constancias.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Rnd } from 'react-rnd';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {
  doc, getDoc, collection, getDocs,
  query, where, documentId,
} from 'firebase/firestore';
import { db } from '@/servicios/firebaseConfig';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

import { useCourses } from '@/utilidades/useCourses';
import AttendanceModal from '@/componentes/AttendanceModal';
import { ToastContainer, toast } from 'react-toastify';
import { FiLoader } from 'react-icons/fi';
import 'react-toastify/dist/ReactToastify.css';
import {
  arrayBufferToBase64,
  PDF_W,
  PDF_H,
  FONT_LOOKUP,
  FONT_OPTIONS,
  toRGB,
    fechaLarga,
    fitTextToHeight
  } from '@/utilidades/pdfHelpers';


// ==========================================
// CONFIG
// ==========================================

// Si usas otra colección para respuestas del registro de equipos, cámbiala aquí:
const COL_E_R = 'encuestas_respuestas';

// Convierte ArrayBuffer → Base64 en el navegador
// URL relativa en prod / localhost en dev
const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000';

// Cajas por defecto (plantilla editable)
const defaultBoxes = {
  nombre:  { x:98,  y:260, w:400, h:40,  color:'#374151', size:26, bold:true,  align:'center', font:'Helvetica-Bold', preview:'NOMBRE / EQUIPO'  },
  mensaje: { x:58,  y:320, w:480, h:100, color:'#374151', size:14, bold:false, align:'left',   font:'Helvetica',       preview:'MENSAJE' },
  fecha:   { x:98,  y:560, w:400, h:30,  color:'#a16207', size:15, bold:true,  align:'center', font:'Helvetica-Bold', preview:'FECHA'    },
};

// ==========================================
// PEQUEÑOS HELPERS
// ==========================================
const notify = (msg, type='info') =>
  toast[type](msg, { position:'top-right', theme:'colored', autoClose:3000 });

const getNombreCompleto = part => {
  if (!part) return '';
  if (part.Nombres && part.ApellidoP) return `${part.Nombres} ${part.ApellidoP}`;
  if (part.Nombres) return part.Nombres;
  if (part.nombre) return part.nombre;
  return '';
};
const getPuesto = part => part?.puesto || part?.Puesto || '';
const getCursoTitulo = (curso, part) =>
  curso?.titulo || curso?.cursoNombre || part?.cursoNombre || 'Sin nombre';
const getFechaInicio = (curso, part) =>
  curso?.fechaInicio || part?.fechaInicio || '';
const getFechaFin = (curso, part) =>
  curso?.fechaFin || part?.fechaFin || '';

// Ajuste suave de tamaño si el texto se desborda la altura de la caja (auto-fit)



// ==========================================
// COMPONENTE
// ==========================================
export default function Constancias() {
  const { courses } = useCourses();

  // Estados generales
  const [pdfSize, setPdfSize]             = useState({ w:PDF_W, h:PDF_H });
  const [plantilla, setPlantilla]         = useState(null);
  const [plantillaUrl, setPlantillaUrl]   = useState(null);

  const [cursoId, setCursoId]             = useState('');
  const [curso, setCurso]                 = useState(null);

  // MODO: individuales (personal/asistencias) vs equipos (registro de grupos)
  const [modo, setModo]                   = useState('individual'); // 'individual' | 'equipos'

  // Individuales
  const [participantes, setParticipantes] = useState([]);
  const [asistencias, setAsistencias]     = useState([]);
  const [checkedInit, setCheckedInit]     = useState({});

  // Equipos
  const [equipos, setEquipos]             = useState([]);
  const [checkedEquipos, setCheckedEquipos] = useState({});
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const categoriasEquipos = useMemo(() => {
    const set = new Set();
    equipos.forEach(e => {
      const cat = e?.preset?.categoria;
      if (cat) set.add(cat);
    });
    return Array.from(set);
  }, [equipos]);

  // Config por plantilla
  const [cfgMap, setCfgMap]               = useState({});
  const plantillaKey = plantilla ? `${plantilla.byteLength}` : 'none';

  const [activeBox, setActiveBox]         = useState(null);
  const [panelOpen, setPanelOpen]         = useState(false);

  const [participantOverrides, setParticipantOverrides] = useState({});
  const [editId, setEditId]               = useState(null);
  const [boxesEditing, setBoxesEditing]   = useState(null);
  const [msgPdfEditing, setMsgPdfEditing] = useState('');
  const [msgMailEditing, setMsgMailEditing] = useState('');

  const [isPreview, setIsPreview]         = useState(false);
  const [prevURLs, setPrevURLs]           = useState([]);
  const [prevIdx, setPrevIdx]             = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingZip, setLoadingZip]       = useState(false);
  const [loadingSend, setLoadingSend]     = useState(false);

  const [showAttendance, setShowAttendance] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);

  const fileRef = useRef(null);

  // Blob URL de la plantilla
  useEffect(() => {
    if (!plantilla) { setPlantillaUrl(null); return; }
    const url = URL.createObjectURL(new Blob([plantilla], { type:'application/pdf' }));
    setPlantillaUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [plantilla]);

  // Lee tamaño real del PDF
  useEffect(() => {
    if (!plantilla) return;
    (async () => {
      const pdf  = await PDFDocument.load(plantilla);
      const page = pdf.getPages()[0];
      setPdfSize({ w: page.getWidth(), h: page.getHeight() });
    })();
  }, [plantilla]);

  // Inicializa configuración de cajas
  useEffect(() => {
    if (plantilla && !cfgMap[plantillaKey]) {
      setCfgMap(m => ({
        ...m,
        [plantillaKey]: {
          boxes: JSON.parse(JSON.stringify(defaultBoxes)),
          mensajePDF: '',
          mensajeCorreo: ''
        }
      }));
    }
  }, [plantilla, plantillaKey, cfgMap]);

  const cfg   = cfgMap[plantillaKey] || {};
  const boxes = cfg.boxes || defaultBoxes;

  // ─── Hook: carga curso y datos asociados ───
  useEffect(() => {
    if (!cursoId) {
      setCurso(null);
      setParticipantes([]);
      setAsistencias([]);
      setEquipos([]);
      return;
    }
    let alive = true;
    (async () => {
      const snap = await getDoc(doc(db, 'Cursos', cursoId));
      if (!alive || !snap.exists()) return;
      const data = snap.data();
      setCurso(data);

      // ============= INDIVIDUALES (personal y asistencias) ============
      // Participantes iniciales (lista del curso)
      const idsInit = Array.isArray(data.listas?.[0]) 
        ? data.listas[0] 
        : data.listas || [];
      let iniciales = [];
      if (idsInit.length) {
        const batches = [];
        for (let i = 0; i < idsInit.length; i += 30) {
          batches.push(idsInit.slice(i, i + 30));
        }
        const snapsInit = await Promise.all(
          batches.map(batch =>
            getDocs(query(
              collection(db, 'Personal'),
              where(documentId(), 'in', batch)
            ))
          )
        );
        iniciales = snapsInit.flatMap(s => s.docs.map(d => ({ id: d.id, ...d.data() })));
      }
      if (!alive) return;
      setParticipantes(iniciales);
      setCheckedInit(iniciales.reduce((o,_,i)=>(o[i]=false,o), {}));

      // Asistencias registradas en colección independiente
      const snapAsis = await getDocs(
        query(collection(db, 'Asistencias'), where('cursoId', '==', cursoId))
      );
      const rawAsis = snapAsis.docs.map(d => ({ id: d.id, ...d.data() }));
      setAsistencias(rawAsis);

      // ============= EQUIPOS (registro por encuesta) ============
      // Si el curso tiene encuestaId, traemos los equipos
      if (data.encuestaId) {
        const snapEquipos = await getDocs(
          query(collection(db, COL_E_R), where('encuestaId', '==', data.encuestaId))
        );
        const eq = snapEquipos.docs.map(d => ({
          id: d.id,
          ...d.data(), // {encuestaId, preset:{nombreEquipo, nombreLider, contactoEquipo}, custom:{...}}
        }));
        setEquipos(eq);
        setCheckedEquipos(eq.reduce((o,e)=> (o[e.id] = false, o), {}));
      } else {
        setEquipos([]);
        setCheckedEquipos({});
      }
    })();
    return () => { alive = false; };
  }, [cursoId]);

  // Mensajes por defecto al seleccionar curso + plantilla
  useEffect(() => {
    if (!curso || !plantilla) return;
    const titulo = getCursoTitulo(curso);
    const ini    = getFechaInicio(curso);
    const fin    = getFechaFin(curso);
    const defPdf  = `Por su participación en “${titulo}”, del ${fechaLarga(ini)} al ${fechaLarga(fin)}.`;
    const defMail = `Hola {nombre},\n\nAdjunto tu constancia de “${titulo}”.\n\nSaludos.`;
    setCfgMap(m => ({
      ...m,
      [plantillaKey]: {
        ...m[plantillaKey],
        mensajePDF:    m[plantillaKey]?.mensajePDF || defPdf,
        mensajeCorreo: m[plantillaKey]?.mensajeCorreo || defMail
      }
    }));
  }, [curso, plantilla, plantillaKey]);

  // Ajusta posición/tamaño cajas
  const clamp = (v,min,max) => Math.max(min, Math.min(max, v));
  const patchBox = (id, patch, target='template') => {
    const fix = o => ({
      ...o,
      x: clamp(o.x, 0, pdfSize.w-20),
      y: clamp(o.y, 0, pdfSize.h-20),
      w: Math.max(40, o.w),
      h: Math.max(20, o.h)
    });
    if (target==='edit') {
      setBoxesEditing(b => ({ ...b, [id]: fix({...b[id],...patch}) }));
    } else {
      setCfgMap(m => ({
        ...m,
        [plantillaKey]: {
          ...m[plantillaKey],
          boxes: { ...m[plantillaKey].boxes, [id]: fix({...m[plantillaKey].boxes[id],...patch}) }
        }
      }));
    }
  };

  // ============ SELECCIÓN ============

  // Individuales: unión de seleccionados de "iniciales" + todas las asistencias (checkbox fijo)
  const selInit  = participantes.filter((_,i)=>checkedInit[i]);
  const selAsis  = asistencias;
  const selInd   = [...selInit, ...selAsis];

  // Equipos seleccionados
  const selEquip = equipos.filter(e => checkedEquipos[e.id]);

  // === NOMBRE Y TEXTO POR MODO ===
  const buildTextContext = (ent) => {
    if (modo === 'individual') {
      const nombre      = getNombreCompleto(ent).toUpperCase();
      const puesto      = getPuesto(ent);
      const tituloCurso = getCursoTitulo(curso, ent);
      const ini         = getFechaInicio(curso, ent);
      const fin         = getFechaFin(curso, ent);
      return { nombre, puesto, tituloCurso, ini, fin };
    } else {
      // modo equipos
      const preset = ent?.preset || {};
      const nombreEquipo = (preset.nombreEquipo || 'EQUIPO').toUpperCase();
      const tituloCurso  = getCursoTitulo(curso);
      const ini          = getFechaInicio(curso);
      const fin          = getFechaFin(curso);
      // Para el "puesto", mostramos el líder si existe:
      const puesto       = preset.nombreLider ? `Líder: ${preset.nombreLider}` : '';
      return { nombre: nombreEquipo, puesto, tituloCurso, ini, fin };
    }
  };

  // ============ GENERADOR DE PDF ============

  const genPDF = async (ent) => {
    const pdf   = await PDFDocument.load(plantilla);
    pdf.registerFontkit(fontkit);
    const page  = pdf.getPages()[0];

    const ov    = participantOverrides[ent.id] || {};
    const bx    = ov.boxes || boxes;
    const txt   = ov.msgPdf ?? cfg.mensajePDF;

    const { nombre, puesto, tituloCurso, ini, fin } = buildTextContext(ent);

    for (const [key, cfgBox] of Object.entries(bx)) {
      let texto = '';
      if (key==='nombre') texto = nombre;
      else if (key==='mensaje') {
        // placeholders disponibles:
        // {nombre}, {curso}, {puesto}, {fechainicio}, {fechafin}
        texto = (txt || '')
          .replace('{nombre}', nombre)
          .replace('{curso}',  tituloCurso)
          .replace('{puesto}', puesto)
          .replace('{fechainicio}', fechaLarga(ini))
          .replace('{fechafin}',    fechaLarga(fin));

        // fallback si faltan reemplazos
        if (!texto || texto.includes('{')) {
          texto = `Por su participación en “${tituloCurso}”, del ${fechaLarga(ini)} al ${fechaLarga(fin)}.`;
        }
      } else if (key==='fecha') {
        texto = fechaLarga(fin);
      }

      // Fuente y color
      const fontRef = FONT_LOOKUP[cfgBox.font] || StandardFonts.Helvetica;
      const font  = await pdf.embedFont(fontRef);
      const color = toRGB(cfgBox.color);

      // Auto-fit
      const { size: finalSize, lines } = fitTextToHeight({
        font,
        text: texto,
        boxW: cfgBox.w,
        boxH: cfgBox.h,
        baseSize: cfgBox.size,
        minSize: Math.min(10, cfgBox.size), // evita degradar demasiado
        align: cfgBox.align,
        lineGap: 2
      });

      let y = page.getHeight() - cfgBox.y - finalSize;
      lines.forEach(line => {
        const w = font.widthOfTextAtSize(line, finalSize);
        let x   = cfgBox.x;
        if      (cfgBox.align==='center') x += (cfgBox.w - w)/2;
        else if (cfgBox.align==='right')  x += cfgBox.w - w;
        page.drawText(line, { x, y, size: finalSize, font, color });
        y -= finalSize + 2;
      });
    }

    return pdf.save();
  };

  const blobUrl = buf => URL.createObjectURL(new Blob([buf],{ type:'application/pdf' }));

  // === Selección final según modo ===
  const sel = modo === 'individual' ? selInd : selEquip;

  // ============ ACCIONES ============

  const handlePreview = async () => {
    if (!plantilla)  return notify('Sube una plantilla PDF','warning');
    if (!sel.length) return notify('Selecciona participantes o equipos','warning');
    setLoadingPreview(true);
    try {
      const bufs = await Promise.all(sel.map(genPDF));
      prevURLs.forEach(URL.revokeObjectURL);
      setPrevURLs(bufs.map(blobUrl));
      setPrevIdx(0);
      setIsPreview(true);
    } catch (e) {
      console.error(e);
      notify('Error generando vista previa','error');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleZip = async () => {
    if (!plantilla)  return notify('Sube una plantilla PDF','warning');
    if (!sel.length) return notify('Selecciona participantes o equipos','warning');
    setLoadingZip(true);
    try {
      const zip = new JSZip();
      for (const ent of sel) {
        const buf = await genPDF(ent);
        let baseName = 'Constancia';
        if (modo === 'individual') {
          const nm  = getNombreCompleto(ent).replace(/\s+/g,'_') || 'Sin_Nombre';
          baseName  = `${baseName}_${getCursoTitulo(curso,ent)}_${nm}`;
        } else {
          const equipo = (ent?.preset?.nombreEquipo || 'Equipo').replace(/\s+/g,'_');
          baseName  = `${baseName}_${getCursoTitulo(curso)}_${equipo}`;
        }
        zip.file(`${baseName}.pdf`, buf);
      }
      saveAs(await zip.generateAsync({ type:'blob' }), `Constancias_${getCursoTitulo(curso)}.zip`);
    } catch (e) {
      console.error(e);
      notify('Error creando ZIP','error');
    } finally {
      setLoadingZip(false);
    }
  };

  const handleSend = async () => {
    if (!plantilla)  return notify('Sube una plantilla PDF','warning');
    if (!sel.length) return notify('Selecciona participantes o equipos','warning');
    setLoadingSend(true);

    try {
      for (const ent of sel) {
        const buf    = await genPDF(ent);
        const base64 = arrayBufferToBase64(buf);

        // Correo destino:
        // - Individual: usa `ent.correo`
        // - Equipo: usa `preset.contactoEquipo`
        let destino = modo === 'individual'
          ? (ent?.correo || '')
          : (ent?.preset?.contactoEquipo || '');
        if (!destino) {
          // si no hay correo, omite envío pero no rompas el bucle
          console.warn('Sin correo para:', ent);
          continue;
        }

        // Nombre para saludo
        const { nombre } = buildTextContext(ent);
        const msg = (participantOverrides[ent.id]?.msgMail||cfg.mensajeCorreo || '')
                      .replace('{nombre}', nombre);

        const payload = {
          Correo:        destino,
          Nombres:       nombre,
          Puesto:        getCursoTitulo(curso, ent),
          pdf:           base64,
          mensajeCorreo: msg
        };
        const res = await fetch(`${API_BASE_URL}/EnviarCorreo`, {
          method:  'POST',
          headers: { 'Content-Type':'application/json' },
          body:    JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
      }
      notify('Correos enviados','success');
    } catch (err) {
      console.error(err);
      notify('Error enviando correos','error');
    } finally {
      setLoadingSend(false);
    }
  };

  const toggleInit = i => setCheckedInit(o => ({ ...o, [i]: !o[i] }));
  const toggleEquipo = id => setCheckedEquipos(o => ({ ...o, [id]: !o[id] }));

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="h-full flex bg-gray-50">
      {/* SIDEBAR */}
      <aside className="w-80 p-4 bg-white shadow space-y-6 overflow-auto">
        {/* Plantilla PDF */}
        <div>
          <h4 className="font-semibold mb-2">Plantilla PDF</h4>
          <button
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            onClick={()=>fileRef.current?.click()}
          >
            {plantilla ? 'Cambiar plantilla' : 'Subir plantilla'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={async e=>{
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              try {
                setPlantilla(await f.arrayBuffer());
                setIsPreview(false);
              } catch {
                notify('No se pudo abrir el PDF','error');
              }
            }}
          />
        </div>

        {/* Seleccionar Evento */}
        <div>
          <h4 className="font-semibold mb-2">Seleccionar Evento</h4>
          <select
            className="w-full p-2 border rounded"
            value={cursoId}
            onChange={e=>{ setCursoId(e.target.value); setIsPreview(false); }}
          >
            <option value="">-- Elige --</option>
            {courses.map(c=> (
              <option key={c.id} value={c.id}>
                {c.titulo || c.cursoNombre}
              </option>
            ))}
          </select>
        </div>

        {/* Modo de generación */}
        <div>
          <h4 className="font-semibold mb-2">Modo de generación</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="modo"
                value="individual"
                checked={modo==='individual'}
                onChange={()=>{ setModo('individual'); setIsPreview(false); }}
              />
              <span>Individuales (Personal / Asistencias)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="modo"
                value="equipos"
                checked={modo==='equipos'}
                onChange={()=>{ setModo('equipos'); setIsPreview(false); }}
                disabled={!curso?.encuestaId}
              />
              <span>Por equipos (Registro de grupos)</span>
            </label>
            {!curso?.encuestaId && (
              <p className="text-xs text-amber-600">
                Este curso no tiene <code>encuestaId</code>. Genera el link/encuesta para habilitar equipos.
              </p>
            )}
          </div>
        </div>

        {/* LISTAS según modo */}
        {modo==='individual' ? (
          <>
            {/* Participantes Iniciales */}
            <div>
              <h4 className="font-semibold mb-1">Participantes Iniciales</h4>
              <div className="border rounded max-h-40 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-200">
                    <tr>
                      <th className="w-8 p-2">Sel</th>
                      <th className="p-2">Nombre</th>
                      <th className="p-2">Puesto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participantes.map((p,i)=>(
                      <tr key={p.id||i} className="odd:bg-gray-100 hover:bg-gray-200">
                        <td className="text-center p-2">
                          <input
                            type="checkbox"
                            checked={checkedInit[i]||false}
                            onChange={()=>toggleInit(i)}
                          />
                        </td>
                        <td className="p-2 break-words">{getNombreCompleto(p)}</td>
                        <td className="p-2 break-words">{getPuesto(p)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Asistencias Registradas */}
            <div>
              <h4 className="font-semibold mb-1">Asistencias Registradas</h4>
              <div className="border rounded max-h-40 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-200">
                    <tr>
                      <th className="w-8 p-2">Sel</th>
                      <th className="p-2">Nombre</th>
                      <th className="p-2">Puesto</th>
                      <th className="p-2">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asistencias.map((p,i)=>(
                      <tr key={p.id||i} className="odd:bg-gray-100 hover:bg-gray-200">
                        <td className="text-center p-2">
                          <input type="checkbox" checked disabled />
                        </td>
                        <td className="p-2 break-words">{getNombreCompleto(p)}</td>
                        <td className="p-2 break-words">{getPuesto(p)}</td>
                        <td className="text-center p-2">
                          <button
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                            onClick={()=>{ setAttendanceData(p); setShowAttendance(true); }}
                          >
                            Detalles
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          // MODO EQUIPOS
          <div>
            <h4 className="font-semibold mb-1">Equipos registrados</h4>
            {categoriasEquipos.length > 0 && (
              <select
                className="mb-2 w-full p-2 border rounded"
                value={categoriaFiltro}
                onChange={e=>setCategoriaFiltro(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categoriasEquipos.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
            <div className="border rounded max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-200">
                  <tr>
                    <th className="w-8 p-2">Sel</th>
                    <th className="p-2">Equipo</th>
                    <th className="p-2">Líder</th>
                    <th className="p-2">Contacto</th>
                    <th className="p-2">Categoría</th>
                  </tr>
                </thead>
                <tbody>
                  {equipos.length ? equipos
                    .filter(eq => !categoriaFiltro || eq?.preset?.categoria === categoriaFiltro)
                    .map(eq => (
                    <tr key={eq.id} className="odd:bg-gray-100 hover:bg-gray-200">
                      <td className="text-center p-2">
                        <input
                          type="checkbox"
                          checked={!!checkedEquipos[eq.id]}
                          onChange={()=>toggleEquipo(eq.id)}
                        />
                      </td>
                      <td className="p-2 break-words">{eq?.preset?.nombreEquipo || '—'}</td>
                      <td className="p-2 break-words">{eq?.preset?.nombreLider  || '—'}</td>
                      <td className="p-2 break-words">{eq?.preset?.contactoEquipo|| '—'}</td>
                      <td className="p-2 break-words">{eq?.preset?.categoria || '—'}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="text-center p-3 text-gray-500">No hay equipos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              * Las respuestas se leen de <code>{COL_E_R}</code> filtradas por <code>encuestaId</code>.
            </p>
          </div>
        )}

        {/* Mensajes */}
        <div>
          <h4 className="font-semibold mb-1">Mensaje PDF</h4>
          <textarea
            rows={3}
            className="w-full p-2 border rounded"
            value={cfg.mensajePDF || ''}
            onChange={e=>setCfgMap(m=>({
              ...m,
              [plantillaKey]:{...m[plantillaKey], mensajePDF:e.target.value}
            }))}
            placeholder='Ej: Por su participación en "{curso}", del {fechainicio} al {fechafin}.'
          />
          <p className="text-[11px] text-gray-500 mt-1">
            Placeholders: <code>{'{nombre}'}</code>, <code>{'{curso}'}</code>, <code>{'{puesto}'}</code>, <code>{'{fechainicio}'}</code>, <code>{'{fechafin}'}</code>
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-1">Mensaje Correo</h4>
          <textarea
            rows={3}
            className="w-full p-2 border rounded"
            value={cfg.mensajeCorreo || ''}
            onChange={e=>setCfgMap(m=>({
              ...m,
              [plantillaKey]:{...m[plantillaKey], mensajeCorreo:e.target.value}
            }))}
            placeholder="Hola {nombre}, adjunto tu constancia..."
          />
        </div>

        {/* Acciones */}
        <div className="space-y-2">
          <button
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded flex justify-center items-center"
            onClick={handlePreview}
            disabled={loadingPreview}
          >
            {loadingPreview && <FiLoader className="animate-spin mr-2"/>}
            Generar constancias
          </button>
          <button
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded flex justify-center items-center"
            onClick={handleZip}
            disabled={loadingZip}
          >
            {loadingZip && <FiLoader className="animate-spin mr-2"/>}
            Descargar ZIP
          </button>
          <button
            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded flex justify-center items-center"
            onClick={handleSend}
            disabled={loadingSend}
          >
            {loadingSend && <FiLoader className="animate-spin mr-2"/>}
            Enviar por correo
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-4 overflow-auto relative">
        {!plantillaUrl && (
          <div className="flex items-center justify-center h-full text-gray-400">
            Sube una plantilla PDF para comenzar
          </div>
        )}

        {/* Editor de plantilla */}
        {!isPreview && !editId && plantillaUrl && (
          <div
            className="mx-auto bg-white shadow relative"
            style={{ width: pdfSize.w, height: pdfSize.h }}
            onClick={()=>{ setActiveBox(null); setPanelOpen(false); }}
          >
            <object
              data={`${plantillaUrl}#toolbar=0`}
              type="application/pdf"
              width={pdfSize.w}
              height={pdfSize.h}
              className="pointer-events-none absolute top-0 left-0"
            />
            {Object.entries(boxes).map(([id,cfg])=>(
              <Rnd
                key={id}
                bounds="parent"
                position={{ x:cfg.x, y:cfg.y }}
                size={{ width:cfg.w, height:cfg.h }}
                onDragStop={(_,d)=>patchBox(id,{ x:d.x, y:d.y })}
                onResizeStop={(_,__,r)=>patchBox(id,{ w:r.offsetWidth, h:r.offsetHeight })}
                lockAspectRatio={id==='nombre'}
                dragGrid={[4,4]}
                resizeGrid={[4,4]}
                style={{
                  border: activeBox===id ? '2px dashed #2563eb' : '1px dashed transparent',
                  cursor: 'move',
                  position: 'absolute'
                }}
                onClick={e=>{ e.stopPropagation(); setActiveBox(id); setPanelOpen(true); }}
              >
                <div className="w-full h-full overflow-hidden break-all whitespace-pre-wrap"
                  style={{
                    fontFamily: cfg.font,
                    fontSize: cfg.size,
                    fontWeight: cfg.bold ? 700 : 400,
                    color: cfg.color,
                    textAlign: cfg.align==='justify' ? 'justify' : cfg.align,
                    padding: 2
                  }}
                >
                  {cfg.preview}
                </div>
              </Rnd>
            ))}
          </div>
        )}

        {/* Edición individual de una constancia */}
        {!isPreview && editId && boxesEditing && plantillaUrl && (
          <>
            <div className="text-center font-semibold mb-2">
              Editando:&nbsp;
              {(() => {
                if (modo==='individual') {
                  return getNombreCompleto(
                    participantes.find(p=>p.id===editId)
                    || asistencias.find(a=>a.id===editId)
                    || {}
                  );
                } else {
                  const eq = equipos.find(e=>e.id===editId);
                  return eq?.preset?.nombreEquipo || 'Equipo';
                }
              })()}
            </div>
            <div
              className="mx-auto bg-white shadow relative"
              style={{ width: pdfSize.w, height: pdfSize.h }}
              onClick={()=>{ setActiveBox(null); setPanelOpen(false); }}
            >
              <object
                data={`${plantillaUrl}#toolbar=0`}
                type="application/pdf"
                width={pdfSize.w}
                height={pdfSize.h}
                className="pointer-events-none absolute top-0 left-0"
              />
              {Object.entries(boxesEditing).map(([id,cfg])=>(
                <Rnd
                  key={id}
                  bounds="parent"
                  position={{ x:cfg.x, y:cfg.y }}
                  size={{ width:cfg.w, height:cfg.h }}
                  onDragStop={(_,d)=>patchBox(id,{ x:d.x, y:d.y },'edit')}
                  onResizeStop={(_,__,r)=>patchBox(id,{ w:r.offsetWidth, h:r.offsetHeight },'edit')}
                  lockAspectRatio={id==='nombre'}
                  dragGrid={[4,4]}
                  resizeGrid={[4,4]}
                  style={{
                    border: activeBox===id ? '2px dashed #2563eb' : '1px dashed transparent',
                    cursor: 'move',
                    position: 'absolute'
                  }}
                  onClick={e=>{ e.stopPropagation(); setActiveBox(id); setPanelOpen(true); }}
                >
                  <div className="w-full h-full overflow-hidden break-all whitespace-pre-wrap"
                    style={{
                      fontFamily: cfg.font,
                      fontSize: cfg.size,
                      fontWeight: cfg.bold ? 700 : 400,
                      color: cfg.color,
                      textAlign: cfg.align==='justify' ? 'justify' : cfg.align,
                      padding: 2
                    }}
                  >
                    {cfg.preview}
                  </div>
                </Rnd>
              ))}
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <button
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded"
                onClick={async ()=>{
                  setParticipantOverrides(o=>({
                    ...o,
                    [editId]: {
                      boxes: boxesEditing,
                      msgPdf: msgPdfEditing,
                      msgMail: msgMailEditing
                    }
                  }));
                  setEditId(null);
                  setBoxesEditing(null);
                  setPanelOpen(false);
                  await handlePreview();
                }}
              >
                Guardar
              </button>
              <button
                className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded"
                onClick={()=>{
                  setEditId(null);
                  setBoxesEditing(null);
                  setPanelOpen(false);
                }}
              >
                Cancelar
              </button>
            </div>
            <div className="max-w-lg mx-auto mt-4 space-y-2">
              <textarea
                rows={3}
                className="w-full p-2 border rounded"
                placeholder="Mensaje PDF específico"
                value={msgPdfEditing}
                onChange={e=>setMsgPdfEditing(e.target.value)}
              />
              <textarea
                rows={3}
                className="w-full p-2 border rounded"
                placeholder="Mensaje Correo específico"
                value={msgMailEditing}
                onChange={e=>setMsgMailEditing(e.target.value)}
              />
            </div>
          </>
        )}

        {/* Preview carrusel */}
        {isPreview && prevURLs.length>0 && (
          <div className="mx-auto">
            <div className="flex justify-center items-center gap-4 mb-2">
              <button
                disabled={prevIdx===0}
                className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-40"
                onClick={()=>setPrevIdx(i=>i-1)}
              >
                ← Anterior
              </button>
              <span>{prevIdx+1}/{prevURLs.length}</span>
              <button
                disabled={prevIdx===prevURLs.length-1}
                className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-40"
                onClick={()=>setPrevIdx(i=>i+1)}
              >
                Siguiente →
              </button>
            </div>
            <iframe
              src={prevURLs[prevIdx]}
              title="prev"
              className="w-full bg-gray-50"
              style={{ height: pdfSize.h }}
            />
            <div className="flex justify-center mt-3">
              <button
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded"
                onClick={()=>{
                  const ent = sel[prevIdx];
                  setBoxesEditing(JSON.parse(JSON.stringify(
                    participantOverrides[ent.id]?.boxes || boxes
                  )));
                  setMsgPdfEditing(participantOverrides[ent.id]?.msgPdf||cfg.mensajePDF);
                  setMsgMailEditing(participantOverrides[ent.id]?.msgMail||cfg.mensajeCorreo);
                  setEditId(ent.id);
                  setIsPreview(false);
                }}
              >
                Editar esta constancia
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Panel propiedades */}
      {panelOpen && activeBox && (() => {
        const editing = Boolean(editId);
        const boxCfg  = editing ? boxesEditing[activeBox] : boxes[activeBox];
        const tgt     = editing ? 'edit' : 'template';
        return (
          <aside className="fixed top-0 right-0 w-64 h-full bg-white border-l shadow-lg p-4 overflow-auto z-20">
            <h4 className="font-semibold mb-2">Propiedades “{activeBox}”</h4>
            <label className="block text-xs">Tamaño</label>
            <input
              type="number" min={6} max={72}
              value={boxCfg.size}
              onChange={e=>patchBox(activeBox,{ size:+e.target.value }, tgt)}
              className="w-full p-1 border rounded text-sm"
            />
            <label className="block text-xs mt-2">Color</label>
            <input
              type="color"
              value={boxCfg.color}
              onChange={e=>patchBox(activeBox,{ color:e.target.value }, tgt)}
              className="w-full h-8 p-0"
            />
            <label className="block text-xs mt-2">Fuente</label>
            <select
              value={boxCfg.font}
              onChange={e=>patchBox(activeBox,{ font:e.target.value }, tgt)}
              className="w-full p-1 border rounded text-sm"
            >
              {FONT_OPTIONS.map(f=> <option key={f} value={f}>{f}</option>)}
            </select>
            <label className="block text-xs mt-2">Alineado</label>
            <select
              value={boxCfg.align}
              onChange={e=>patchBox(activeBox,{ align:e.target.value }, tgt)}
              className="w-full p-1 border rounded text-sm"
            >
              {['left','center','right','justify'].map(a=> <option key={a} value={a}>{a}</option>)}
            </select>
            <label className="inline-flex items-center mt-2 text-sm">
              <input
                type="checkbox"
                checked={boxCfg.bold}
                onChange={e=>patchBox(activeBox,{ bold:e.target.checked }, tgt)}
              />
              <span className="ml-2">Negritas</span>
            </label>
            <button
              className="w-full mt-4 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              onClick={()=>{ setPanelOpen(false); setActiveBox(null); }}
            >
              Cerrar
            </button>
          </aside>
        );
      })()}

      {/* Modal asistencia */}
      {showAttendance && (
        <AttendanceModal
          asistencia={attendanceData}
          onClose={()=>setShowAttendance(false)}
        />
      )}

      <ToastContainer/>
    </div>
  );
}
