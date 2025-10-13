import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../servicios/firebaseConfig'
import { Rnd } from 'react-rnd'
import { PDFDocument } from 'pdf-lib'
import { FiArrowLeft, FiLayers } from 'react-icons/fi'
import { fitTextToHeight, FONT_OPTIONS } from '../utilidades/pdfHelpers'
import { getDocument } from 'pdfjs-dist'

// Cajas por defecto (inspiradas en Constancias.jsx)
const defaultBoxes = {
  nombre:       { x:98, y:220, w:400, h:40,  color:'#374151', size:26, align:'center', font:'Helvetica-Bold', preview:'NOMBRE' },
  mensaje:      { x:60, y:280, w:480, h:90,  color:'#374151', size:14, align:'left',   font:'Helvetica',      preview:'Mensaje de la constancia' },
  fecha:        { x:420, y:520, w:120, h:24, color:'#374151', size:12, align:'right',  font:'Helvetica',      preview:'Fecha' }
}

export default function EditorPlantilla() {
  const { id } = useParams()
  const navigate = useNavigate()

  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [plantilla, setPlantilla] = useState(null) // {url, nombre}
  const [pdfSize, setPdfSize] = useState({ w: 842, h: 595 }) // defaults
  const [scale, setScale] = useState(1)
  const [viewport, setViewport] = useState({ w: 842, h: 595 })
  const [boxes, setBoxes] = useState(defaultBoxes)
  const [activeBox, setActiveBox] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Cargar documento de Plantillas
  useEffect(() => {
    let alive = true
    const run = async () => {
      try {
        const d = await getDoc(doc(db, 'Plantillas', id))
        if (!d.exists()) { setError('Plantilla no encontrada'); setLoading(false); return }
        const data = d.data()
        if (alive) setPlantilla({ url: data.url, nombre: data.nombre })
        // Cargar configuración guardada de cajas si existe
        if (alive && data?.boxes && typeof data.boxes === 'object') {
          setBoxes(prev => ({ ...prev, ...data.boxes }))
        }
        // Obtener tamaño real del PDF
        const buf = await fetch(data.url).then(r => r.arrayBuffer())
        const pdf = await PDFDocument.load(buf)
        const page = pdf.getPages()[0]
        const w = page.getWidth(); const h = page.getHeight()
        if (alive) setPdfSize({ w, h })
      } catch (e) {
        console.error(e)
        setError('No se pudo cargar la plantilla')
      } finally {
        setLoading(false)
      }
    }
    run()
    return () => { alive = false }
  }, [id])

  // Escala por altura: ajusta el lienzo a la altura disponible,
  // manteniendo el ancho proporcional. El contenedor permite scroll
  // horizontal si el ancho excede la pantalla.
  useEffect(() => {
    const update = () => {
      const el = containerRef.current
      if (!el) return
      const ch = el.clientHeight
      const s = ch / pdfSize.h
      setScale(s)
      setViewport({ w: Math.floor(pdfSize.w * s), h: Math.floor(pdfSize.h * s) })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [pdfSize])

  // Renderiza la primera página del PDF en un canvas controlado (zoom 100% relativo al PDF y escalado por altura disponible)
  useEffect(() => {
    const render = async () => {
      if (!plantilla?.url || !canvasRef.current) return
      try {
        const loadingTask = getDocument({ url: plantilla.url, isEvalSupported: false })
        const pdf = await loadingTask.promise
        const page = await pdf.getPage(1)
        const vp = page.getViewport({ scale })
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        canvas.width = Math.floor(vp.width)
        canvas.height = Math.floor(vp.height)
        await page.render({ canvasContext: ctx, viewport: vp }).promise
      } catch (err) {
        console.warn('No se pudo renderizar PDF en canvas:', err)
      }
    }
    render()
  }, [plantilla, scale])

  const patchBox = (id, patch) => {
    setBoxes(b => ({ ...b, [id]: { ...b[id], ...patch } }))
  }

  const saveConfig = async () => {
    try {
      setSaving(true)
      await updateDoc(doc(db, 'Plantillas', id), { boxes })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Banner superior con botón regresar */}
      <header className="h-16 bg-white shadow flex items-center justify-between px-4">
        <button
          onClick={() => navigate('/plantillas')}
          className="flex items-center px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
        >
          <FiArrowLeft className="mr-2"/> Regresar
        </button>
        <div className="flex items-center gap-2 text-gray-700">
          <FiLayers className="text-teal-600"/>
          <span className="font-semibold">{plantilla?.nombre || 'Editor de plantilla'}</span>
        </div>
        <div />
      </header>

      {/* Área de edición responsiva */}
      <main ref={containerRef} className="flex-1 p-4 overflow-auto flex">
        {loading && (
          <div className="h-full flex items-center justify-center text-gray-500">Cargando…</div>
        )}
        {!loading && error && (
          <div className="h-full flex items-center justify-center text-red-600">{error}</div>
        )}
        {!loading && !error && plantilla && (
          <>
          <div
            className="mx-auto bg-white shadow relative"
            style={{ width: viewport.w, height: viewport.h }}
          >
            <canvas
              ref={canvasRef}
              width={viewport.w}
              height={viewport.h}
              className="absolute top-0 left-0"
            />

            {/* Overlay editable */}
            {Object.entries(boxes).map(([id, cfg]) => (
              <Rnd
                key={id}
                bounds="parent"
                position={{ x: Math.floor(cfg.x * scale), y: Math.floor(cfg.y * scale) }}
                size={{ width: Math.floor(cfg.w * scale), height: Math.floor(cfg.h * scale) }}
                onDragStop={(_, d) => {
                  patchBox(id, { x: Math.round(d.x / scale), y: Math.round(d.y / scale) })
                }}
                onResizeStop={(_, __, ref) => {
                  patchBox(id, { w: Math.round(ref.offsetWidth / scale), h: Math.round(ref.offsetHeight / scale) })
                }}
                className={`border ${activeBox===id?'border-teal-600':'border-teal-400'} bg-teal-50/50`}
              >
                <div className="w-full h-full p-1 text-gray-700 text-xs" onClick={()=>setActiveBox(id)}>
                  {(() => {
                    const { size: finalSize, lines } = fitTextToHeight({
                      font: { widthOfTextAtSize: (t, s) => t.length * (s * 0.6) },
                      text: cfg.preview || '',
                      boxW: Math.floor(cfg.w * scale),
                      boxH: Math.floor(cfg.h * scale),
                      baseSize: cfg.size,
                      minSize: Math.min(10, cfg.size),
                      align: cfg.align,
                      lineGap: 2
                    })
                    const style = { fontSize: finalSize, color: cfg.color, lineHeight: `${finalSize + 2}px` }
                    if (cfg.align === 'center') style.textAlign = 'center'
                    else if (cfg.align === 'right') style.textAlign = 'right'
                    return (
                      <div style={style} className="w-full h-full overflow-hidden">
                        {lines.map((ln, i) => (<div key={i}>{ln}</div>))}
                      </div>
                    )
                  })()}
                </div>
              </Rnd>
            ))}
          </div>
          {/* Panel lateral de propiedades */}
          <aside className="w-72 ml-4 bg-white rounded-xl shadow p-4 h-full overflow-auto">
            <h4 className="font-semibold mb-3">Propiedades</h4>
            {!activeBox ? (
              <div className="text-sm text-gray-500">Selecciona una caja para editar.</div>
            ) : (
              (()=>{
                const cfg = boxes[activeBox]
                return (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs mb-1">Tamaño</label>
                      <input type="number" min={6} max={72} value={cfg.size}
                        onChange={e=>patchBox(activeBox,{ size:+e.target.value })}
                        className="w-full p-2 border rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Color</label>
                      <input type="color" value={cfg.color}
                        onChange={e=>patchBox(activeBox,{ color:e.target.value })}
                        className="w-full h-8 p-0" />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Fuente</label>
                      <select value={cfg.font}
                        onChange={e=>patchBox(activeBox,{ font:e.target.value })}
                        className="w-full p-2 border rounded text-sm">
                        {FONT_OPTIONS.map(f=> <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Alineado</label>
                      <select value={cfg.align}
                        onChange={e=>patchBox(activeBox,{ align:e.target.value })}
                        className="w-full p-2 border rounded text-sm">
                        <option value="left">Izquierda</option>
                        <option value="center">Centrado</option>
                        <option value="right">Derecha</option>
                      </select>
                    </div>
                    {activeBox==='mensaje' && (
                      <div>
                        <label className="block text-xs mb-1">Mensaje de la constancia</label>
                        <textarea
                          value={cfg.preview || ''}
                          onChange={e=>patchBox(activeBox,{ preview: e.target.value })}
                          rows={5}
                          placeholder="Escribe el contenido del mensaje…"
                          className="w-full p-2 border rounded text-sm"
                        />
                        <div className="text-[11px] text-gray-500 mt-1">
                          Este texto se renderiza dentro de la caja seleccionada.
                        </div>
                      </div>
                    )}
                    <button
                      onClick={saveConfig}
                      className={`w-full py-2 rounded text-white ${saving?'bg-gray-400':'bg-teal-600 hover:bg-teal-700'}`}
                      disabled={saving}
                    >
                      {saving ? 'Guardando…' : 'Guardar configuración'}
                    </button>
                  </div>
                )
              })()
            )}
          </aside>
          </>
        )}
      </main>
    </div>
  )
}