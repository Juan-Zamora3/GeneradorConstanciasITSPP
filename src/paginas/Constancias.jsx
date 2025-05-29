// src/paginas/Constancias.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import tiny from 'tinycolor2';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
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

// ───────── utilidades ─────────
const PDF_W = 595, PDF_H = 842;
const toRGB = hex => { const c = tiny(hex).toRgb(); return rgb(c.r/255,c.g/255,c.b/255); };
const fechaLarga = iso => {
  if (!iso) return '';
  const d = new Date(iso);
  const M = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
  return `${d.getDate()} de ${M[d.getMonth()]} de ${d.getFullYear()}`;
};

// ────────── fuentes ──────────
const FONT_LOOKUP = {
  Helvetica: StandardFonts.Helvetica,
  'Helvetica-Bold': StandardFonts.HelveticaBold,
  TimesRoman: StandardFonts.TimesRoman,
  'Times-Bold': StandardFonts.TimesBold,
  Courier: StandardFonts.Courier,
};
const FONT_OPTIONS = Object.keys(FONT_LOOKUP);

// ────────── cajas por defecto ──────────
const defaultBoxes = {
  nombre:  { x:98,  y:260, w:400, h:40,  color:'#374151', size:26, bold:true,  align:'center', font:'Helvetica-Bold', preview:'NOMBRE'  },
  mensaje: { x:58,  y:320, w:480, h:100, color:'#374151', size:14, bold:false, align:'left',   font:'Helvetica',       preview:'MENSAJE' },
  fecha:   { x:98,  y:560, w:400, h:30,  color:'#a16207', size:15, bold:true,  align:'center', font:'Helvetica-Bold', preview:'FECHA'   },
};

// helpers para normalizar los datos
const getNombreCompleto = (part) => {
  // Si viene de asistentes, es "nombre", si viene de alumnos, es "Nombres" + "ApellidoP"
  if (part.Nombres && part.ApellidoP) return `${part.Nombres} ${part.ApellidoP}`.trim();
  if (part.Nombres) return `${part.Nombres}`.trim();
  if (part.nombre) return part.nombre.trim();
  return '';
};

const getPuesto = (part) => part.Puesto || part.puesto || '';
const getCursoTitulo = (curso, part) =>
  curso?.titulo || curso?.cursoNombre || part?.cursoNombre || 'Sin nombre';

const getFechaInicio = (curso, part) =>
  curso?.fechaInicio || part?.fechaInicio || '';
const getFechaFin = (curso, part) =>
  curso?.fechaFin || part?.fechaFin || '';

const wrapText = (text, font, size, maxW) => {
  const out = [];
  text.split('\n').forEach(line => {
    let current = '';
    line.split(' ').forEach(word => {
      const probe = current ? `${current} ${word}` : word;
      const width = font.widthOfTextAtSize(probe, size);
      if (width > maxW && current) {
        out.push(current);
        current = word;
      } else current = probe;
    });
    out.push(current);
  });
  return out;
};

export default function Constancias() {
  const { courses } = useCourses();

  // estado
  const [pdfSize, setPdfSize]             = useState({ w: PDF_W, h: PDF_H });
  const [plantilla, setPlantilla]         = useState(null);
  const [plantillaUrl, setPlantillaUrl]   = useState(null);
  const [cursoId, setCursoId]             = useState('');
  const [curso, setCurso]                 = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [asistencias, setAsistencias]     = useState([]);
  const [checkedInit, setCheckedInit]     = useState({});
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

  const notify = (msg, type='info') =>
    toast[type](msg, { position:'top-right', theme:'colored', autoClose:3000 });

  // Blob URL de plantilla
  useEffect(() => {
    if (!plantilla) { setPlantillaUrl(null); return; }
    const url = URL.createObjectURL(new Blob([plantilla], { type:'application/pdf' }));
    setPlantillaUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [plantilla]);

  // tamaño real PDF
  useEffect(() => {
    if (!plantilla) return;
    (async () => {
      const pdf = await PDFDocument.load(plantilla);
      const page = pdf.getPages()[0];
      setPdfSize({ w: page.getWidth(), h: page.getHeight() });
    })();
  }, [plantilla]);

  // inicializar cfgMap
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
  const boxes = cfg.boxes    || defaultBoxes;

  // carga curso y listas
  useEffect(() => {
    if (!cursoId) {
      setCurso(null);
      setParticipantes([]);
      setAsistencias([]);
      return;
    }
    let alive = true;
    (async () => {
      const snap = await getDoc(doc(db,'Cursos',cursoId));
      if (!alive || !snap.exists()) return;
      const data = snap.data();
      setCurso(data);

      // participantes iniciales
      const ids = Array.isArray(data.listas?.[0]) ? data.listas[0] : (data.listas||[]);
      let iniciales = [];
      if (ids.length) {
        const batches = [];
        for (let i = 0; i < ids.length; i += 30) batches.push(ids.slice(i, i+30));
        const qs = await Promise.all(
          batches.map(b => getDocs(query(collection(db,'Alumnos'), where(documentId(),'in',b))))
        );
        iniciales = qs.flatMap(q => q.docs.map(d => ({ id:d.id, ...d.data() })));
      }
      if (!alive) return;
      setParticipantes(iniciales);
      setCheckedInit(iniciales.reduce((o,_,i)=>(o[i]=false,o),{}));

      // asistencias (siempre incluidas)
      const reales = data.asistencias || [];
      setAsistencias(reales);
    })();
    return () => { alive = false; };
  }, [cursoId]);

  // mensajes por defecto
  useEffect(() => {
    if (!curso || !plantilla) return;
    const cursoTitulo = getCursoTitulo(curso);
    const fechaInicio = getFechaInicio(curso);
    const fechaFin    = getFechaFin(curso);
    const defPdf  = `Por su participación en “${cursoTitulo}”, del ${fechaLarga(fechaInicio)} al ${fechaLarga(fechaFin)}.`;
    const defMail = `Hola {nombre},\n\nAdjunto tu constancia de “${cursoTitulo}”.\n\nSaludos.`;
    setCfgMap(m => ({
      ...m,
      [plantillaKey]: {
        ...m[plantillaKey],
        mensajePDF:    m[plantillaKey].mensajePDF || defPdf,
        mensajeCorreo: m[plantillaKey].mensajeCorreo || defMail
      }
    }));
  }, [curso, plantilla, plantillaKey]);

  // ajustar cajas
  const clamp = (v,min,max) => Math.max(min, Math.min(max, v));
  const patchBox = (id, patch, target='template') => {
    const fix = o => ({
      ...o,
      x: clamp(o.x, 0, pdfSize.w-20),
      y: clamp(o.y, 0, pdfSize.h-20),
      w: Math.max(40, o.w),
      h: Math.max(20, o.h)
    });
    if (target === 'edit') {
      setBoxesEditing(b => ({ ...b, [id]: fix({ ...b[id], ...patch }) }));
    } else {
      setCfgMap(m => ({
        ...m,
        [plantillaKey]: {
          ...m[plantillaKey],
          boxes: { ...m[plantillaKey].boxes, [id]: fix({ ...m[plantillaKey].boxes[id], ...patch }) }
        }
      }));
    }
  };

  // generar PDF (CORREGIDO)
  const genPDF = async part => {
    const pdf = await PDFDocument.load(plantilla);
    pdf.registerFontkit(fontkit);
    const page = pdf.getPages()[0];

    const ov = participantOverrides[part.id] || {};
    const bx = ov.boxes || boxes;
    const textoPDF = ov.msgPdf ?? cfg.mensajePDF;

    const nombre = getNombreCompleto(part).toUpperCase();
    const puesto = getPuesto(part);
    const cursoTitulo = getCursoTitulo(curso, part);
    const fechaInicio = getFechaInicio(curso, part);
    const fechaFin = getFechaFin(curso, part);

    for (const [key, cfgBox] of Object.entries(bx)) {
      let texto = '';
      if (key === 'nombre') texto = nombre;
      else if (key === 'mensaje') {
        texto = (textoPDF || '')
          .replace('{nombre}', nombre)
          .replace('{curso}', cursoTitulo)
          .replace('{puesto}', puesto)
          .replace('{fechainicio}', fechaLarga(fechaInicio))
          .replace('{fechafin}', fechaLarga(fechaFin));
        if (!texto || texto.includes('{')) {
          // fallback
          texto = `Por su participación en “${cursoTitulo}”, del ${fechaLarga(fechaInicio)} al ${fechaLarga(fechaFin)}.`;
        }
      } else if (key === 'fecha') texto = fechaLarga(fechaFin);

      const font  = await pdf.embedFont(FONT_LOOKUP[cfgBox.font] || StandardFonts.Helvetica);
      const color = toRGB(cfgBox.color);
      const size  = cfgBox.size;
      const maxW  = cfgBox.w;
      let   y     = page.getHeight() - cfgBox.y - size;

      const lines = wrapText(texto, font, size, maxW);
      lines.forEach(line => {
        const width = font.widthOfTextAtSize(line, size);
        let x = cfgBox.x;
        if (cfgBox.align === 'center') x += (maxW - width) / 2;
        else if (cfgBox.align === 'right') x += maxW - width;
        else if (cfgBox.align === 'justify') {
          const words = line.split(' ');
          const tot = words.map(w=>font.widthOfTextAtSize(w,size)).reduce((a,b)=>a+b,0);
          const extra = (maxW - tot)/(words.length-1||1);
          let xj = cfgBox.x;
          words.forEach(w => {
            page.drawText(w, { x:xj, y, size, font, color });
            xj += font.widthOfTextAtSize(w,size) + extra;
          });
          y -= size + 2;
          return;
        }
        page.drawText(line, { x, y, size, font, color });
        y -= size + 2;
      });
    }
    return pdf.save();
  };
  const blobUrl = buf => URL.createObjectURL(new Blob([buf],{ type:'application/pdf' }));

  // selecciones
  const selInit = participantes.filter((_,i)=>checkedInit[i]);
  const selReal = asistencias; // todos siempre incluidos
  const sel     = [...selInit, ...selReal];

  // acciones
  const handlePreview = async () => {
    if (!plantilla)  return notify('Sube una plantilla PDF','warning');
    if (!sel.length) return notify('Selecciona participantes','warning');
    setLoadingPreview(true);
    try {
      const bufs = await Promise.all(sel.map(genPDF));
      prevURLs.forEach(URL.revokeObjectURL);
      setPrevURLs(bufs.map(blobUrl));
      setPrevIdx(0);
      setIsPreview(true);
    } catch {
      notify('Error generando vista previa','error');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleZip = async () => {
    if (!plantilla)  return notify('Sube una plantilla PDF','warning');
    if (!sel.length) return notify('Selecciona participantes','warning');
    setLoadingZip(true);
    try {
      const zip = new JSZip();
      for (const p of sel) {
        const buf = await genPDF(p);
        const nm  = getNombreCompleto(p).replace(/\s+/g,'_');
        zip.file(`Constancia_${getCursoTitulo(curso,p)}_${nm}.pdf`, buf);
      }
      saveAs(await zip.generateAsync({ type:'blob' }), `Constancias_${getCursoTitulo(curso)}.zip`);
    } catch {
      notify('Error creando ZIP','error');
    } finally {
      setLoadingZip(false);
    }
  };

  const handleSend = async () => {
    if (!plantilla)  return notify('Sube una plantilla PDF','warning');
    if (!sel.length) return notify('Selecciona participantes','warning');
    setLoadingSend(true);
    try {
      for (const p of sel) {
        const buf = await genPDF(p);
        const nombre = getNombreCompleto(p);
        const payload = {
          Correo: p.correo||p.email,
          Nombres: nombre,
          Puesto: getCursoTitulo(curso,p),
          pdf: Buffer.from(buf).toString('base64'),
          mensajeCorreo: (participantOverrides[p.id]?.msgMail||cfg.mensajeCorreo)
                           .replace('{nombre}', nombre)
        };
        const res = await fetch('/EnviarCorreo',{
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body:JSON.stringify(payload)
        });
        if (!res.ok) throw new Error();
      }
      notify('Correos enviados','success');
    } catch {
      notify('Error enviando correos','error');
    } finally {
      setLoadingSend(false);
    }
  };

  // toggle inicial
  const toggleInit = i =>
    setCheckedInit(o => ({ ...o, [i]: !o[i] }));

  return (
    <div className="h-full flex bg-gray-50">
      {/* SIDEBAR */}
      <aside className="w-72 p-4 bg-white shadow space-y-6 overflow-auto">
        {/* plantilla */}
        <div>
          <h4 className="font-semibold mb-2">Plantilla PDF</h4>
          <button
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            onClick={()=>fileRef.current?.click()}
          >{plantilla?'Cambiar plantilla':'Subir plantilla'}</button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={async e=>{
              const f = e.target.files?.[0]; e.target.value = '';
              if (!f) return;
              try { setPlantilla(await f.arrayBuffer()); setIsPreview(false); }
              catch { notify('No se pudo abrir el PDF','error'); }
            }}
          />
        </div>

        {/* evento */}
        <div>
          <h4 className="font-semibold mb-2">Seleccionar Evento</h4>
          <select
            className="w-full p-2 border rounded"
            value={cursoId}
            onChange={e=>{ setCursoId(e.target.value); setIsPreview(false); }}
          >
            <option value="">-- Elige --</option>
            {courses.map(c=> <option key={c.id} value={c.id}>{c.titulo || c.cursoNombre}</option> )}
          </select>
        </div>

        {/* participantes iniciales */}
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
                    <td className="p-2 break-words">
                      {getNombreCompleto(p)}
                    </td>
                    <td className="p-2 break-words">{getPuesto(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* asistencias (siempre marcadas) */}
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
                    <td className="p-2 break-words">
                      {getNombreCompleto(p)}
                    </td>
                    <td className="p-2 break-words">{getPuesto(p)}</td>
                    <td className="text-center p-2">
                      <button
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                        onClick={()=>{ setAttendanceData(p); setShowAttendance(true); }}
                      >Detalles</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* mensajes */}
        <div>
          <h4 className="font-semibold mb-1">Mensaje PDF</h4>
          <textarea
            rows={3}
            className="w-full p-2 border rounded"
            value={cfg.mensajePDF}
            onChange={e=>setCfgMap(m=>({
              ...m,
              [plantillaKey]:{...m[plantillaKey], mensajePDF:e.target.value}
            }))}
          />
        </div>
        <div>
          <h4 className="font-semibold mb-1">Mensaje Correo</h4>
          <textarea
            rows={3}
            className="w-full p-2 border rounded"
            value={cfg.mensajeCorreo}
            onChange={e=>setCfgMap(m=>({
              ...m,
              [plantillaKey]:{...m[plantillaKey], mensajeCorreo:e.target.value}
            }))}
          />
        </div>

        {/* acciones */}
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
            {loadingZip&&<FiLoader className="animate-spin mr-2"/>}
            Descargar ZIP
          </button>
          <button
            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded flex justify-center items-center"
            onClick={handleSend}
            disabled={loadingSend}
          >
            {loadingSend&&<FiLoader className="animate-spin mr-2"/>}
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

        {/* editor de plantilla */}
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
                grid={[4,4]}
                style={{
                  border: activeBox===id?'2px dashed #2563eb':'none',
                  cursor:'move',
                  position:'absolute'
                }}
                onClick={e=>{ e.stopPropagation(); setActiveBox(id); setPanelOpen(true); }}
              >
                <div className="w-full h-full overflow-hidden break-all whitespace-pre-wrap"
                  style={{
                    fontFamily: cfg.font,
                    fontSize: cfg.size,
                    fontWeight: cfg.bold?700:400,
                    color: cfg.color,
                    textAlign: cfg.align==='justify'? 'justify' : cfg.align
                  }}
                >{cfg.preview}</div>
              </Rnd>
            ))}
          </div>
        )}

        {/* edición individual */}
        {!isPreview && editId && boxesEditing && plantillaUrl && (
          <>
            {/* encabezado */}
            <div className="text-center font-semibold mb-2">
              Editando:&nbsp;
              {getNombreCompleto(participantes.find(p=>p.id===editId) || asistencias.find(a=>a.id===editId) || {})}
            </div>
            {/* lienzo movible */}
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
                  grid={[4,4]}
                  style={{
                    border: activeBox===id?'2px dashed #2563eb':'none',
                    cursor:'move',
                    position:'absolute'
                  }}
                  onClick={e=>{ e.stopPropagation(); setActiveBox(id); setPanelOpen(true); }}
                >
                  <div className="w-full h-full overflow-hidden break-all whitespace-pre-wrap"
                    style={{
                      fontFamily: cfg.font,
                      fontSize: cfg.size,
                      fontWeight: cfg.bold?700:400,
                      color: cfg.color,
                      textAlign: cfg.align==='justify'? 'justify' : cfg.align
                    }}
                  >{cfg.preview}</div>
                </Rnd>
              ))}
            </div>
            {/* botones */}
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
              >Guardar</button>
              <button
                className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded"
                onClick={()=>{
                  setEditId(null);
                  setBoxesEditing(null);
                  setPanelOpen(false);
                }}
              >Cancelar</button>
            </div>
            {/* mensajes específicos */}
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

        {/* preview carrusel */}
        {isPreview && prevURLs.length>0 && (
          <div className="mx-auto">
            <div className="flex justify-center items-center gap-4 mb-2">
              <button
                disabled={prevIdx===0}
                className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-40"
                onClick={()=>setPrevIdx(i=>i-1)}
              >← Anterior</button>
              <span>{prevIdx+1}/{prevURLs.length}</span>
              <button
                disabled={prevIdx===prevURLs.length-1}
                className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-40"
                onClick={()=>setPrevIdx(i=>i+1)}
              >Siguiente →</button>
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
                  const p = sel[prevIdx];
                  setBoxesEditing(JSON.parse(JSON.stringify(participantOverrides[p.id]?.boxes||boxes)));
                  setMsgPdfEditing(participantOverrides[p.id]?.msgPdf||cfg.mensajePDF);
                  setMsgMailEditing(participantOverrides[p.id]?.msgMail||cfg.mensajeCorreo);
                  setEditId(p.id);
                  setIsPreview(false);
                }}
              >Editar esta constancia</button>
            </div>
          </div>
        )}
      </main>

      {/* panel propiedades */}
      {panelOpen && activeBox && (() => {
        const editing = Boolean(editId);
        const boxCfg  = editing ? boxesEditing[activeBox] : boxes[activeBox];
        const tgt     = editing ? 'edit' : 'template';
        return (
          <aside className="fixed top-0 right-0 w-64 h-full bg-white border-l shadow-lg p-4 overflow-auto z-20">
            <h4 className="font-semibold mb-2">Propiedades “{activeBox}”</h4>
            <label className="block text-xs">Tamaño</label>
            <input
              type="number" min={6} max={60}
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
            >Cerrar</button>
          </aside>
        );
      })()}

      {/* modal asistencia */}
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
