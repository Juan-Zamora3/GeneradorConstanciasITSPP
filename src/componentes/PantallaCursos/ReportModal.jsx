import React, { useState, useEffect } from 'react';
import ImageCarousel from '../common/ImageCarousel';

/* ---------- helpers ---------- */
const fileToDataURL = file =>
  new Promise(res => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);     // siempre produce algo válido
    fr.readAsDataURL(file);
  });

const compressDataURL = (dataURL, maxW = 700, quality = 0.7) =>
  new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const w = img.width * scale;
      const h = img.height * scale;
      const cvs = document.createElement('canvas');
      cvs.width = w; cvs.height = h;
      cvs.getContext('2d').drawImage(img, 0, 0, w, h);
      try {
        const out = cvs.toDataURL('image/jpeg', quality);
        // si por algún motivo devuelve solo "data:", usamos original
        res(out.length > 10 ? out : dataURL);
      } catch {
        res(dataURL);
      }
    };
    img.onerror = () => res(dataURL);     // fallback
    img.src = dataURL;
  });

/* ---------- bytes aproximados ---------- */
const b64bytes = str =>
  (str.length * 3) / 4 - (str.endsWith('==') ? 2 : str.endsWith('=') ? 1 : 0);

export default function ReportModal({
  isOpen,
  onClose,
  onSubmit,
  cursos = [],
  initialData = {},
}) {
  const [form,   setForm]   = useState({ cursoId:'', tipo:'', titulo:'', fecha:'', descripcion:'' });
  const [images, setImages] = useState([]);   // data-URL válidas
  const [busy,   setBusy]   = useState(false);

  /* ----- reset ----- */
  useEffect(() => {
    if (isOpen && initialData.id) {
      setForm({
        cursoId:     initialData.cursoId,
        tipo:        initialData.tipo,
        titulo:      initialData.titulo,
        fecha:       initialData.fecha?.slice(0,10) || '',
        descripcion: initialData.descripcion,
      });
      setImages(initialData.imagenes || []);
    } else if (isOpen) {
      setForm({ cursoId:'', tipo:'', titulo:'', fecha:'', descripcion:'' });
      setImages([]);
    }
  }, [isOpen, initialData]);

  /* ----- seleccionar archivos ----- */
  const handleFiles = async e => {
    setBusy(true);
    const files     = Array.from(e.target.files);
    const originals = await Promise.all(files.map(fileToDataURL));
    const finals    = await Promise.all(originals.map(d => compressDataURL(d)));
    setImages(prev => [...prev, ...finals]);
    setBusy(false);
  };

  /* ----- submit ----- */
  const submit = e => {
    e.preventDefault();
    const docSize =
      JSON.stringify({ ...form, imagenes: images }).length +
      images.reduce((n,d)=>n+b64bytes(d),0);
    if (docSize > 950_000) {
      alert('Las imágenes exceden 1 MB. Elimina o reduce algunas.');
      return;
    }
    onSubmit(form, images);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={submit}
        className="bg-white rounded-lg max-w-xl w-full p-6 space-y-4 overflow-y-auto max-h-full">

        <h3 className="text-xl font-semibold">
          {initialData.id ? 'Editar Reporte' : 'Nuevo Reporte'}
        </h3>

        {/* -------- campos básicos -------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select required name="cursoId" value={form.cursoId}
                  onChange={e=>setForm(f=>({...f,cursoId:e.target.value}))}
                  className="border rounded px-3 py-2">
            <option value="">Seleccionar curso</option>
            {cursos.map(c => <option key={c.id} value={c.id}>{c.titulo}</option>)}
          </select>

          <select required name="tipo" value={form.tipo}
                  onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}
                  className="border rounded px-3 py-2">
            <option value="">Tipo de reporte</option>
            <option value="asistencia">Asistencia</option>
            <option value="incidente">Incidente</option>
            <option value="evaluacion">Evaluación</option>
          </select>

          <input required name="titulo" placeholder="Título"
                 value={form.titulo}
                 onChange={e=>setForm(f=>({...f,titulo:e.target.value}))}
                 className="border rounded px-3 py-2 col-span-full"/>

          <input required type="date" name="fecha" value={form.fecha}
                 onChange={e=>setForm(f=>({...f,fecha:e.target.value}))}
                 className="border rounded px-3 py-2 col-span-full"/>
        </div>

        <textarea rows="3" placeholder="Descripción"
                  value={form.descripcion}
                  onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))}
                  className="border rounded px-3 py-2 w-full"/>

        <input type="file" multiple accept="image/*"
               onChange={handleFiles} className="w-full"/>

        {/* -------- preview -------- */}
        {images.length > 0 && (
          <>
            <ImageCarousel images={images} auto={false}/>
            <small className="block text-center text-gray-500 mt-1">
              Clic miniatura → al frente · 🗑️ para quitar
            </small>

            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {images.map((src,i)=>(
                <div key={i} className="relative">
                  <img src={src} alt=""
                       className="h-16 w-16 object-cover rounded cursor-pointer hover:ring-2 hover:ring-blue-500"
                       onClick={()=>setImages(arr=>{
                         const c=[...arr]; [c[0],c[i]]=[c[i],c[0]]; return c;
                       })}/>
                  <button type="button"
                          onClick={()=>setImages(arr=>arr.filter((_,idx)=>idx!==i))}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center">
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* -------- acciones -------- */}
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose}
                  className="px-4 py-2 border rounded">Cancelar</button>
          <button type="submit" disabled={busy}
                  className={`px-4 py-2 rounded text-white ${busy?'bg-gray-400':'bg-green-600 hover:bg-green-700'}`}>
            {busy ? 'Procesando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
