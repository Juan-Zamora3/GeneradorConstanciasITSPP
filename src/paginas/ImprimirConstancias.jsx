import React, { useState, useEffect, useContext } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Printer, FileText, Home, Sparkles, Award, Star } from 'lucide-react'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { AuthContext } from '../contexto/AuthContext'
import { getConfigConstancia, subirYRegistrarConstancia } from '../servicios/constancias'

const API_BASE = import.meta.env.VITE_API_BASE || ''

export default function ImprimirConstancias() {
  const navigate = useNavigate()
  const { cursoId } = useParams()
  const location = useLocation()
  const { constancias, equipo, curso, factura } = location.state || {}
  const { usuario } = useContext(AuthContext)

  const [cfg, setCfg] = useState(null)
  const [generandoPDFs, setGenerandoPDFs] = useState(true)
  const [progreso, setProgreso] = useState(0)
  const [constanciasGeneradas, setConstanciasGeneradas] = useState([])
  const [impresionCompleta, setImpresionCompleta] = useState(false)
  const [tiempoRestante, setTiempoRestante] = useState(10)

  const fitFontSize = (font, text, wanted, maxWidth) => {
    let size = wanted || 16
    while (size > 8 && font.widthOfTextAtSize(String(text), size) > maxWidth) size -= 0.5
    return size
  }
  const resolveFieldValue = (key, c) => {
    const map = {
      NOMBRE: c?.nombre,
      MENSAJE: c?.mensaje,
      EQUIPO: c?.equipo || equipo?.nombre,
      CATEGORIA: c?.categoria || curso?.categoria || curso?.categoriaNombre,
      CURSO: curso?.cursoNombre || curso?.nombre,
      FECHA: new Date().toLocaleDateString('es-MX'),
      FOLIO: c?.folio,
      CORREO: c?.correo || c?.email,
    }
    return (map[key] ?? c?.[key] ?? '')
  }
  const drawTextInRectPct = (page, font, boldFont, campo, texto) => {
    const { width: pw, height: ph } = page.getSize()
    const x = (campo.xPct || 0) * pw
    const yTop = (campo.yPct || 0) * ph
    const w = (campo.wPct || 0.5) * pw
    const h = (campo.hPct || 0.05) * ph

    const chosenFont = campo.bold ? boldFont : font
    let size = campo.fontSize || 16
    size = fitFontSize(chosenFont, texto, size, w)

    const textWidth = chosenFont.widthOfTextAtSize(String(texto), size)
    let xDraw = x
    if (campo.align === 'center') xDraw = x + (w - textWidth) / 2
    else if (campo.align === 'right') xDraw = x + w - textWidth

    const baseline = ph - yTop - Math.min(h, size * 0.9)
    page.drawText(String(texto), { x: Math.max(x, xDraw), y: Math.max(0, baseline), size, font: chosenFont, color: rgb(0,0,0), maxWidth: w })
  }

  useEffect(() => { (async () => {
    try { setCfg(await getConfigConstancia(cursoId)) } catch (e) { console.error(e) }
  })() }, [cursoId])

  const generarPDFConstancia = async (constancia) => {
    try {
      let pdfDoc
      if (cfg?.plantilla?.url) {
        const proxied = `${API_BASE}/proxy-pdf?url=${encodeURIComponent(cfg.plantilla.url)}`
        const ab = await fetch(proxied).then(r => r.arrayBuffer())
        pdfDoc = await PDFDocument.load(ab, { ignoreEncryption: true })
      } else {
        pdfDoc = await PDFDocument.create()
        pdfDoc.addPage([595, 842])
      }
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      const campos = Array.isArray(cfg?.campos) ? cfg.campos : []
      for (const campo of campos) {
        const pageIndex = Math.min(Math.max(campo.page || 0, 0), pdfDoc.getPageCount() - 1)
        const page = pdfDoc.getPage(pageIndex)
        const value = resolveFieldValue(campo.key, constancia)
        drawTextInRectPct(page, font, boldFont, campo, value ?? '')
      }
      return await pdfDoc.save()
    } catch (error) {
      console.error('Error generando PDF:', error)
      return null
    }
  }

  const generarTodasLasConstancias = async () => {
    if (!constancias?.length) return
    setGenerandoPDFs(true)
    const generadas = []

    for (let i = 0; i < constancias.length; i++) {
      const c = constancias[i]
      setProgreso(((i + 1) / constancias.length) * 100)

      const pdfBytes = await generarPDFConstancia(c)
      if (pdfBytes) {
        try {
          const participante = {
            nombre: c.nombre,
            correo: c.correo || c.email,
            folio: c.folio || `${(curso?.slug || 'CURSO').toUpperCase()}-${String(i + 1).padStart(4, '0')}`
          }
          const generadoPor = usuario?.correo || usuario?.email || 'desconocido'
          const { url } = await subirYRegistrarConstancia(cursoId, pdfBytes, participante, generadoPor)
          generadas.push({ ...c, pdfBytes, pdfUrl: url })
        } catch (e) {
          console.error('No se pudo subir/registrar la constancia:', e)
          generadas.push({ ...c, pdfBytes, pdfUrl: URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' })) })
        }
      }
      await new Promise(r => setTimeout(r, 150))
    }

    setConstanciasGeneradas(generadas)
    setGenerandoPDFs(false)
    setTimeout(() => setImpresionCompleta(true), 1200)
  }

  const descargarTodas = async () => {
    if (!constanciasGeneradas.length) return
    const zip = new JSZip()
    constanciasGeneradas.forEach((c, idx) => {
      const nombreArchivo = `Constancia_${String(c.nombre || `Participante_${idx+1}`).replace(/\s+/g, '_')}.pdf`
      zip.file(nombreArchivo, c.pdfBytes)
    })
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    saveAs(zipBlob, `Constancias_${equipo?.nombre || 'Equipo'}.zip`)
  }

  const handleVolverInicio = () => navigate('/pantalla-cajero')

  useEffect(() => {
    if (!constancias || !equipo || !curso || !factura) {
      navigate(`/equipos-curso/${cursoId}`); return
    }
  }, [constancias, equipo, curso, factura, cursoId, navigate])

  useEffect(() => {
    if (cfg && constancias && equipo && curso && factura) generarTodasLasConstancias()
  }, [cfg])

  useEffect(() => {
    if (impresionCompleta && tiempoRestante > 0) {
      const t = setTimeout(() => setTiempoRestante(s => s - 1), 1000)
      return () => clearTimeout(t)
    } else if (impresionCompleta && tiempoRestante === 0) {
      handleVolverInicio()
    }
  }, [impresionCompleta, tiempoRestante])

  if (!constancias || !equipo || !curso || !factura || !cfg) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <motion.div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 flex items-center space-x-4" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="text-gray-700 font-medium">Preparando constancias…</span>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {impresionCompleta && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div key={i} className="absolute" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
              initial={{ opacity: 0, scale: 0, rotate: 0 }}
              animate={{ opacity: [0,1,0], scale: [0,1,0], rotate: [0,360], y: [0,-100] }}
              transition={{ duration: 3, delay: i * 0.1, ease: 'easeOut' }}>
              {i % 3 === 0 ? <Star className="w-4 h-4 text-yellow-400" /> : i % 3 === 1 ? <Sparkles className="w-4 h-4 text-purple-400" /> : <Award className="w-4 h-4 text-green-400" />}
            </motion.div>
          ))}
        </div>
      )}

      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="max-w-3xl mx-auto px-8 w-full">
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}>
            <div className="bg-white/80 backdrop-blur-xl border-indigo-200 shadow-2xl overflow-hidden relative rounded-xl">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"></div>
              <div className="p-16 text-center space-y-10">
                {generandoPDFs || !impresionCompleta ? (
                  <>
                    <motion.div className="w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto shadow-2xl"
                      animate={{ scale: [1,1.1,1], rotate: [0,5,-5,0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                      <motion.div animate={{ y: [0,-10,0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
                        <Printer className="w-16 h-16 text-indigo-600" />
                      </motion.div>
                    </motion.div>

                    <div className="space-y-6">
                      <motion.h1 className="text-4xl bg-gradient-to-r from-indigo-900 to-purple-700 bg-clip-text text-transparent">Generando Constancias</motion.h1>
                      <motion.p className="text-gray-600 text-xl">Preparando documentos con la plantilla y posiciones guardadas…</motion.p>
                    </div>

                    <div className="space-y-6">
                      <div className="flex justify-between text-lg text-gray-600">
                        <span>Progreso</span>
                        <span className="font-medium">{`${Math.ceil((progreso / 100) * constancias.length)} de ${constancias.length} completadas`}</span>
                      </div>
                      <div className="relative">
                        <div className="w-full h-4 bg-gray-200 rounded-full"></div>
                        <motion.div className="absolute top-0 left-0 h-4 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full" style={{ width: `${progreso}%` }} />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <motion.div className="w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-2xl" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <CheckCircle className="w-16 h-16 text-green-600" />
                    </motion.div>

                    <div className="space-y-6">
                      <motion.h1 className="text-4xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">¡Impresión Completada!</motion.h1>
                      <motion.p className="text-gray-600 text-xl">Se han generado y subido {constanciasGeneradas.length} constancia{constanciasGeneradas.length !== 1 ? 's' : ''}.</motion.p>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg rounded-xl p-8">
                      <div className="space-y-4">
                        <h3 className="text-green-800 text-xl font-medium">Constancias generadas:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {constanciasGeneradas.map((c, idx) => (
                            <div key={idx} className="flex items-center justify-between space-x-3 p-3 bg-white/50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <a href={c.pdfUrl} target="_blank" rel="noreferrer" className="text-green-700 font-medium underline">
                                  {c.nombre}
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-6">
                          <button onClick={descargarTodas} className="px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium shadow">Descargar ZIP</button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <button onClick={handleVolverInicio} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-12 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 w-full rounded-xl flex items-center justify-center">
                        <Home className="w-5 h-5 mr-3" /> Regresar al Inicio
                      </button>
                      <div className="text-blue-600 text-sm mt-2">
                        Regresando automáticamente en <span className="font-bold text-lg">{tiempoRestante}</span> s
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
