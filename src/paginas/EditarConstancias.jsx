// src/paginas/EditarConstancias.jsx
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion } from "framer-motion"
import { ArrowLeft, Edit3, FileText, Save, Eye, User, Check, Users } from "lucide-react"
import itsppLogo from '../assets/logo.png'
import { getConfigConstancia } from '../servicios/constancias'

/* ========================= pdf.js ROBUSTO (Render-safe) ========================= */
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/build/pdf.mjs'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker'
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'

// 1) intento: worker como instancia (rápido para Vite)
let workerSet = false
try {
  GlobalWorkerOptions.workerPort = new pdfjsWorker()
  workerSet = true
} catch {}

// 2) fallback: asset URL emitido por Vite
if (!workerSet) {
  try {
    GlobalWorkerOptions.workerSrc = workerUrl
    workerSet = true
  } catch {}
}

// 3) último intento: CDN (evita fallos de worker en Render)
if (!workerSet) {
  GlobalWorkerOptions.workerSrc =
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs'
}
/* ============================================================================== */

export default function EditarConstancias() {
  const navigate = useNavigate()
  const { cursoId, equipoId } = useParams()
  const location = useLocation()
  const { integrantesSeleccionados, equipo, curso } = location.state || {}

  const [cfg, setCfg] = useState(null)                  // { plantilla:{url,nombre,...}, campos:[...] }
  const [constancias, setConstancias] = useState([])   // participantes a editar
  const [constanciaActual, setConstanciaActual] = useState(0)
  const [editandoNombre, setEditandoNombre] = useState(false)
  const [nombreEditado, setNombreEditado] = useState('')
  const [loading, setLoading] = useState(true)

  const handleGoBack = () => navigate(`/seleccionar-integrantes/${cursoId}/${equipoId}`)

  const handleEditarNombre = (index) => {
    setConstanciaActual(index)
    setNombreEditado(constancias[index].nombre)
    setEditandoNombre(true)
  }

  const handleGuardarNombre = () => {
    setConstancias(prev => prev.map((c, i) =>
      i === constanciaActual ? { ...c, nombre: nombreEditado } : c
    ))
    setEditandoNombre(false)
    setNombreEditado('')
  }

  const handleCancelarEdicion = () => {
    setEditandoNombre(false)
    setNombreEditado('')
  }

  const handleContinuar = () => {
    navigate(`/confirmar-pago/${cursoId}/${equipoId}`, {
      state: { constancias, equipo, curso }
    })
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible'
    const date = new Date(fecha)
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  /* ======================== Cargar datos base + configuración ======================== */
  useEffect(() => {
    if (!integrantesSeleccionados || !equipo || !curso) {
      navigate(`/equipos-curso/${cursoId}`)
      return
    }

    // Participantes a editar
    const constanciasData = integrantesSeleccionados.map((integrante, index) => ({
      id: `${equipoId}-${index}`,
      nombre: integrante?.nombre || `Integrante ${index + 1}`,
      email: integrante?.email || '',
      equipo: equipo?.nombre,
      lider: equipo?.lider,
      categoria: equipo?.categoria,
      curso: curso?.nombre || curso?.cursoNombre,
      instructor: curso?.instructor,
      fechaGeneracion: new Date(),
      mensaje: `Por su participación en "${curso?.nombre || curso?.cursoNombre}" como ${integrante?.nombre === equipo?.lider ? 'Líder' : 'Integrante'} del equipo "${equipo?.nombre}".`,
      folio: integrante?.folio || ''
    }))
    setConstancias(constanciasData)
    setLoading(false)

    ;(async () => {
      try {
        const conf = await getConfigConstancia(cursoId) // { plantilla, campos }
        setCfg(conf || { campos: [] })
      } catch (e) {
        console.error('No se pudo cargar Cursos/{cursoId}.constancia:', e)
        setCfg({ campos: [] })
      }
    })()
  }, [integrantesSeleccionados, equipo, curso, cursoId, equipoId, navigate])

  /* ======================== Medidas del contenedor A4 ======================== */
  const contRef = useRef(null)
  const bgCanvasRef = useRef(null)
  const [contSize, setContSize] = useState({ w: 595, h: 842 })

  useLayoutEffect(() => {
    const measure = () => {
      if (!contRef.current) return
      const w = contRef.current.getBoundingClientRect().width
      const h = (842 / 595) * w
      setContSize({ w, h })
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (contRef.current) ro.observe(contRef.current)
    return () => ro.disconnect()
  }, [])

  /* ======================== Pintar fondo PDF en canvas (Render-safe) ======================== */
  useEffect(() => {
    let cancelled = false

    const paint = async () => {
      if (!cfg?.plantilla?.url || !bgCanvasRef.current || !contSize.w) return
      try {
        // Cargar PDF como ArrayBuffer evita problemas de CORS/range en Render
        const ab = await fetch(cfg.plantilla.url, { mode: 'cors', cache: 'no-store' }).then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          return r.arrayBuffer()
        })

        const loading = getDocument({
          data: ab,
          isEvalSupported: false,
          useWorkerFetch: false,
          useSystemFonts: true
        })
        const pdf = await loading.promise
        const page = await pdf.getPage(1)

        const scale = contSize.w / 595
        const viewport = page.getViewport({ scale })

        const canvas = bgCanvasRef.current
        const ctx = canvas.getContext('2d', { willReadFrequently: false })

        // IMPORTANTE: asignar width/height nativos al canvas
        canvas.width = Math.ceil(viewport.width)
        canvas.height = Math.ceil(viewport.height)
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        await page.render({ canvasContext: ctx, viewport }).promise
        if (cancelled) return
      } catch (e) {
        console.warn('No se pudo mostrar PDF de fondo:', e)
        const c = bgCanvasRef.current
        if (c) c.getContext('2d')?.clearRect(0, 0, c.width, c.height)
      }
    }

    paint()
    return () => { cancelled = true }
  }, [cfg?.plantilla?.url, contSize.w])

  /* ======================== Helpers de valores y campos ======================== */
  const getValue = (key, c) => {
    const map = {
      NOMBRE: c?.nombre,
      MENSAJE: c?.mensaje,
      EQUIPO: c?.equipo || equipo?.nombre,
      CATEGORIA: c?.categoria || curso?.categoria || curso?.categoriaNombre,
      CURSO: c?.curso || curso?.cursoNombre || curso?.nombre,
      FECHA: new Date().toLocaleDateString('es-MX'),
      FOLIO: c?.folio,
      CORREO: c?.email || c?.correo
    }
    return map[key] ?? c?.[key] ?? ''
  }

  const Campo = ({ campo, participante }) => {
    const left   = (campo.xPct || 0) * contSize.w
    const top    = (campo.yPct || 0) * contSize.h
    const width  = (campo.wPct || 0.5) * contSize.w
    const height = (campo.hPct || 0.06) * contSize.h
    const fontPx = Math.max(8, (campo.fontSize || 16) * (contSize.w / 595))
    const justify =
      campo.align === 'center' ? 'center' :
      campo.align === 'right'  ? 'flex-end' : 'flex-start'
    const value = String(getValue(campo.key, participante) ?? '')

    return (
      <div className="absolute" style={{ left, top, width, height, pointerEvents: 'none' }}>
        <div
          className="w-full h-full flex items-center"
          style={{
            justifyContent: justify,
            fontWeight: campo.bold ? 700 : 400,
            fontSize: fontPx,
            lineHeight: 1.1,
            color: '#0f172a',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={value}
        >
          {value}
        </div>
      </div>
    )
  }

  /* ======================== PREVIEW (tu diseño + PDF real) ======================== */
  const CertificatePreview = ({ constancia }) => (
    <motion.div
      className="bg-white border-2 border-purple-200 rounded-2xl p-8 text-center space-y-6 shadow-xl relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Decorativos */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-green-500 to-red-500"></div>
      <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full opacity-30"></div>
      <div className="absolute bottom-4 left-4 w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full opacity-30"></div>

      <motion.div
        className="border-b border-purple-100 pb-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <motion.div
          className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
          whileHover={{ scale: 1.05, rotate: 5 }}
          transition={{ duration: 0.3 }}
        >
          <img src={itsppLogo} alt="ITSPP Logo" className="w-12 h-12" />
        </motion.div>
        <h3 className="text-2xl text-blue-900">Instituto Tecnológico Superior</h3>
        <h4 className="text-xl text-blue-900">de Puerto Peñasco</h4>
      </motion.div>

      {/* Preview real: PDF en canvas + campos encima */}
      <div className="py-6">
        <div
          ref={contRef}
          className="relative mx-auto rounded-xl overflow-hidden border border-purple-200 bg-white"
          style={{
            width: 'min(720px, 100%)',
            aspectRatio: '595 / 842',
            boxShadow: 'inset 0 0 32px rgba(124,58,237,.06)'
          }}
        >
          <canvas
            ref={bgCanvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ imageRendering: 'auto' }}
          />
          {Array.isArray(cfg?.campos) && cfg.campos.length > 0 && constancia && (
            cfg.campos.map((c, i) => <Campo key={i} campo={c} participante={constancia} />)
          )}
          {(!cfg?.campos || cfg.campos.length === 0) && (
            <div className="absolute inset-0 flex items-start justify-start p-6 text-slate-500 text-sm pointer-events:none">
              No hay campos configurados en <b className="mx-1">Cursos/{{cursoId}}.constancia.campos</b>
            </div>
          )}
        </div>

        <div className="pt-8 text-base text-gray-700">
          <p>Puerto Peñasco, Sonora</p>
          <p>{formatearFecha(constancia?.fechaGeneracion)}</p>
        </div>
      </div>

      <motion.div
        className="border-t border-purple-100 pt-4 text-sm text-gray-500"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <p>Categoría: {constancia?.categoria || 'Sin categoría'}</p>
        {cfg?.plantilla?.nombre && <p className="mt-1 text-indigo-700">Plantilla: {cfg.plantilla.nombre}</p>}
      </motion.div>
    </motion.div>
  )

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <motion.div
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 flex items-center space-x-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="text-gray-700 font-medium">Preparando constancias...</span>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 relative overflow-hidden flex flex-col">
      {/* Fondo animado */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"
          animate={{ rotate: [0, 360], scale: [1, 1.3, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl"
          animate={{ rotate: [360, 0], scale: [1.2, 1, 1.2] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Header */}
      <motion.header
        className="relative z-10 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg flex-shrink-0"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <button
                  onClick={handleGoBack}
                  className="border border-purple-200 text-purple-900 hover:bg-purple-50 bg-white/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 p-3 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </motion.div>
              <div>
                <motion.h1
                  className="text-3xl bg-gradient-to-r from-purple-900 to-pink-700 bg-clip-text text-transparent"
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  Editar Constancias
                </motion.h1>
                <motion.p
                  className="text-purple-600"
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  {curso?.nombre || curso?.cursoNombre} • {equipo?.nombre}
                </motion.p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main */}
      <main className="relative z-10 flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Sidebar izquierda: participantes */}
          <motion.div
            className="lg:col-span-1"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="bg-white/80 backdrop-blur-xl border-purple-200 shadow-xl h-full rounded-xl overflow-hidden">
              <div className="p-4 border-b border-purple-100">
                <div className="flex items-center space-x-2 text-purple-900">
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Participantes ({constancias.length})</span>
                </div>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-300px)]">
                {constancias.map((c, index) => (
                  <motion.div
                    key={c.id}
                    className={`p-4 rounded-xl cursor-pointer border-2 transition-all duration-300 ${
                      constanciaActual === index
                        ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300 shadow-lg'
                        : 'bg-white/50 border-gray-200 hover:border-purple-200 hover:bg-purple-50'
                    }`}
                    onClick={() => setConstanciaActual(index)}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${constanciaActual === index ? 'bg-purple-500' : 'bg-gray-300'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${constanciaActual === index ? 'text-purple-900' : 'text-gray-700'}`}>
                          {c.nombre}
                        </p>
                        <p className="text-xs text-gray-500">
                          {c.nombre === equipo?.lider ? 'Líder' : 'Integrante'}
                        </p>
                      </div>
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditarNombre(index) }}
                          className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    </div>

                    <div className="mt-2 text-xs">
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-600">{c.email || 'Sin correo'}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Centro: edición + preview */}
          <motion.div
            className="lg:col-span-2 overflow-y-auto"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {constancias.length > 0 && (
              <>
                {/* Controles de edición */}
                <div className="bg-white/80 backdrop-blur-xl border-purple-200 shadow-xl mb-6 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-purple-100">
                    <div className="flex items-center space-x-2 text-purple-900">
                      <FileText className="w-5 h-5" />
                      <span className="font-medium">Editar Constancia</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-purple-900 mb-2 block font-medium">
                          Nombre en la constancia
                        </label>
                        <div className="flex space-x-3">
                          <input
                            value={editandoNombre ? nombreEditado : constancias[constanciaActual]?.nombre}
                            onChange={(e) => setNombreEditado(e.target.value)}
                            disabled={!editandoNombre}
                            className={`flex-1 px-4 py-2 rounded-lg border ${
                              editandoNombre
                                ? 'border-purple-300 focus:border-purple-500 focus:ring-purple-500 bg-white'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                            placeholder="Nombre completo"
                          />
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            {editandoNombre ? (
                              <button
                                onClick={handleGuardarNombre}
                                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg px-4 py-2 rounded-lg flex items-center space-x-2"
                              >
                                <Save className="w-4 h-4" />
                                <span>Guardar</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleEditarNombre(constanciaActual)}
                                className="border border-purple-200 text-purple-700 hover:bg-purple-50 shadow-lg px-4 py-2 rounded-lg flex items-center space-x-2"
                              >
                                <Edit3 className="w-4 h-4" />
                                <span>Editar</span>
                              </button>
                            )}
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <motion.div
                  className="transform scale-90 origin-top"
                  key={constanciaActual}
                  initial={{ opacity: 0, rotateY: 90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <CertificatePreview constancia={constancias[constanciaActual]} />
                </motion.div>
              </>
            )}
          </motion.div>

          {/* Derecha: confirmación */}
          <motion.div
            className="lg:col-span-1 flex flex-col justify-center"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200 shadow-xl rounded-xl overflow-hidden">
              <div className="p-8 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.6, delay: 1 }}>
                  <Eye className="w-16 h-16 text-purple-600 mx-auto mb-6" />
                </motion.div>
                <motion.h3
                  className="text-2xl text-purple-900 mb-3"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                >
                  ¿Todo se ve correcto?
                </motion.h3>
                <motion.p
                  className="text-gray-600 mb-8 text-lg"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.4 }}
                >
                  Verifica que toda la información esté correcta antes de proceder al pago e impresión.
                </motion.p>
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.6 }}
                >
                  <button
                    onClick={handleContinuar}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 w-full rounded-xl flex items-center justify-center"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Confirmar y Continuar
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Modal edición de nombre */}
      {editandoNombre && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-900 to-pink-700 bg-clip-text text-transparent mb-6 text-center">
              Editar Nombre
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-2">
                  Nombre del participante
                </label>
                <input
                  type="text"
                  value={nombreEditado}
                  onChange={(e) => setNombreEditado(e.target.value)}
                  className="w-full px-4 py-3 border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Ingresa el nombre completo"
                  autoFocus
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <motion.button
                  onClick={handleCancelarEdicion}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  onClick={handleGuardarNombre}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Guardar
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
