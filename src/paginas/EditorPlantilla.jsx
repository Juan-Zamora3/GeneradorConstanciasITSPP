import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit3, FileText, Save, Eye, User, Check, Users } from 'lucide-react'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/build/pdf.mjs'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker'
import { getConfigConstancia } from '../servicios/constancias'
import itsppLogo from '../assets/logo.png'

GlobalWorkerOptions.workerPort = new pdfjsWorker()

const API_BASE = import.meta.env.VITE_API_BASE || ''

export default function EditarConstancias() {
  const navigate = useNavigate()
  const { cursoId, equipoId } = useParams()
  const location = useLocation()
  const { integrantesSeleccionados, equipo, curso } = location.state || {}

  const [constancias, setConstancias] = useState([])
  const [constanciaActual, setConstanciaActual] = useState(0)
  const [editandoNombre, setEditandoNombre] = useState(false)
  const [nombreEditado, setNombreEditado] = useState('')
  const [loading, setLoading] = useState(true)
  const [cfg, setCfg] = useState(null) // { plantilla, campos }

  useEffect(() => {
    if (!integrantesSeleccionados || !equipo || !curso) {
      navigate(`/equipos-curso/${cursoId}`)
      return
    }
    const constanciasData = integrantesSeleccionados.map((integrante, index) => ({
      id: `${equipoId}-${index}`,
      nombre: integrante.nombre || `Integrante ${index + 1}`,
      email: integrante.email || '',
      equipo: equipo.nombre,
      lider: equipo.lider,
      categoria: equipo.categoria,
      curso: curso.nombre,
      instructor: curso.instructor,
      fechaGeneracion: new Date(),
      mensaje: `Por su participación en "${curso.nombre}" como ${integrante.nombre === equipo.lider ? 'Líder' : 'Integrante'} del equipo "${equipo.nombre}".`
    }))
    setConstancias(constanciasData)

    ;(async () => {
      try {
        const conf = await getConfigConstancia(cursoId)
        setCfg(conf || null)
      } catch (e) {
        console.error('No se pudo cargar configuración:', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [integrantesSeleccionados, equipo, curso, cursoId, equipoId, navigate])

  const handleGoBack = () => navigate(`/seleccionar-integrantes/${cursoId}/${equipoId}`)
  const handleEditarNombre = (index) => { setConstanciaActual(index); setNombreEditado(constancias[index].nombre); setEditandoNombre(true) }
  const handleGuardarNombre = () => { setConstancias(prev => prev.map((c,i) => i===constanciaActual ? { ...c, nombre: nombreEditado } : c)); setEditandoNombre(false); setNombreEditado('') }
  const handleCancelarEdicion = () => { setEditandoNombre(false); setNombreEditado('') }
  const handleContinuar = () => navigate(`/confirmar-pago/${cursoId}/${equipoId}`, { state: { constancias, equipo, curso } })

  const formatearFecha = (fecha) => {
    try {
      const d = new Date(fecha)
      return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch { return 'Fecha no disponible' }
  }

  return loading ? (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
      <motion.div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 flex items-center space-x-4" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="text-gray-700 font-medium">Preparando constancias...</span>
      </motion.div>
    </div>
  ) : (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 relative overflow-hidden flex flex-col">
      {/* Header */}
      <motion.header className="relative z-10 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg flex-shrink-0" initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center space-x-4">
            <button onClick={handleGoBack} className="border border-purple-200 text-purple-900 hover:bg-purple-50 bg-white/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 p-3 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <motion.h1 className="text-3xl bg-gradient-to-r from-purple-900 to-pink-700 bg-clip-text text-transparent" initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}>
                Editar Constancias
              </motion.h1>
              <motion.p className="text-purple-600" initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.4 }}>
                {curso?.nombre} • {equipo?.nombre}
              </motion.p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main */}
      <main className="relative z-10 flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left list */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-xl border-purple-200 shadow-xl h-full rounded-xl overflow-hidden">
              <div className="p-4 border-b border-purple-100">
                <div className="flex items-center space-x-2 text-purple-900">
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Participantes ({constancias.length})</span>
                </div>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-300px)]">
                {constancias.map((c, index) => (
                  <div
                    key={c.id}
                    className={`p-4 rounded-xl cursor-pointer border-2 transition-all duration-300 ${constanciaActual === index ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300 shadow-lg' : 'bg-white/50 border-gray-200 hover:border-purple-200 hover:bg-purple-50'}`}
                    onClick={() => setConstanciaActual(index)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${constanciaActual === index ? 'bg-purple-500' : 'bg-gray-300'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${constanciaActual === index ? 'text-purple-900' : 'text-gray-700'}`}>{c.nombre}</p>
                        <p className="text-xs text-gray-500">{c.nombre === equipo?.lider ? 'Líder' : 'Integrante'}</p>
                      </div>
                      <button className="p-1 text-gray-400 hover:text-purple-600" onClick={(e) => { e.stopPropagation(); handleEditarNombre(index) }}>
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-2 text-xs flex items-center space-x-1">
                      <User className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">{c.email || 'Sin correo'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center - editor + preview */}
          <div className="lg:col-span-2 overflow-y-auto">
            {constancias.length > 0 && (
              <>
                {/* controls */}
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
                        <label className="text-purple-900 mb-2 block font-medium">Nombre en la constancia</label>
                        <div className="flex space-x-3">
                          <input
                            value={editandoNombre ? nombreEditado : constancias[constanciaActual]?.nombre}
                            onChange={(e) => setNombreEditado(e.target.value)}
                            disabled={!editandoNombre}
                            className={`flex-1 px-4 py-2 rounded-lg border ${editandoNombre ? 'border-purple-300 focus:border-purple-500 focus:ring-purple-500 bg-white' : 'bg-gray-50 border-gray-200'}`}
                            placeholder="Nombre completo"
                          />
                          {editandoNombre ? (
                            <button onClick={handleGuardarNombre} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-green-600 hover:to-emerald-600">
                              <Save className="w-4 h-4" /><span>Guardar</span>
                            </button>
                          ) : (
                            <button onClick={() => handleEditarNombre(constanciaActual)} className="border border-purple-200 text-purple-700 shadow-lg px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-purple-50">
                              <Edit3 className="w-4 h-4" /><span>Editar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PREVIEW REAL DEL PDF + overlay de campos */}
                <PdfPreview
                  cfg={cfg}
                  constancia={constancias[constanciaActual]}
                  formatearFecha={formatearFecha}
                />
              </>
            )}
          </div>

          {/* Right actions */}
          <div className="lg:col-span-1 flex flex-col justify-center">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200 shadow-xl rounded-xl overflow-hidden">
              <div className="p-8 text-center">
                <Eye className="w-16 h-16 text-purple-600 mx-auto mb-6" />
                <h3 className="text-2xl text-purple-900 mb-3">¿Todo se ve correcto?</h3>
                <p className="text-gray-600 mb-8 text-lg">Verifica que toda la información esté correcta antes de proceder.</p>
                <button
                  onClick={handleContinuar}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 w-full rounded-xl flex items-center justify-center"
                >
                  <Check className="w-5 h-5 mr-2" /> Confirmar y Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal editar nombre */}
      {editandoNombre && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4" initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-900 to-pink-700 bg-clip-text text-transparent mb-6 text-center">Editar Nombre</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-2">Nombre del participante</label>
                <input type="text" value={nombreEditado} onChange={(e) => setNombreEditado(e.target.value)} className="w-full px-4 py-3 border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Ingresa el nombre completo" autoFocus />
              </div>
              <div className="flex space-x-3 pt-4">
                <button onClick={handleCancelarEdicion} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50">Cancelar</button>
                <button onClick={handleGuardarNombre} className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700">Guardar</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

/* ---------- PREVIEW COMPONENT: renderiza PDF (primer página) y superpone campos ---------- */
function PdfPreview({ cfg, constancia, formatearFecha }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const [pageSize, setPageSize] = useState({ w: 0, h: 0 })

  // Carga y pinta PDF
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const url = cfg?.plantilla?.url
        if (!url) return
        const proxied = `${API_BASE}/proxy-pdf?url=${encodeURIComponent(url)}`
        const ab = await fetch(proxied).then(r => r.arrayBuffer())
        const pdf = await getDocument({ data: ab, isEvalSupported: false }).promise
        const page = await pdf.getPage(1)

        // Escala para ajustar al ancho del contenedor
        const maxW = wrapRef.current?.clientWidth || 700
        const viewport0 = page.getViewport({ scale: 1 })
        const scale = maxW / viewport0.width
        const viewport = page.getViewport({ scale })

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        canvas.width = viewport.width
        canvas.height = viewport.height
        setPageSize({ w: viewport.width, h: viewport.height })

        await page.render({ canvasContext: ctx, viewport }).promise
      } catch (e) {
        console.error('Preview PDF error:', e)
      }
    })()
    return () => { cancelled = true }
  }, [cfg])

  // util: resolver valor del campo con data de constancia
  const resolveFieldValue = (key) => {
    const map = {
      NOMBRE: constancia?.nombre,
      MENSAJE: constancia?.mensaje,
      EQUIPO: constancia?.equipo,
      CATEGORIA: constancia?.categoria,
      CURSO: constancia?.curso,
      FECHA: formatearFecha(constancia?.fechaGeneracion),
      CORREO: constancia?.email,
    }
    return map[key] ?? ''
  }

  const campos = Array.isArray(cfg?.campos) ? cfg.campos : []

  return (
    <div ref={wrapRef} className="bg-white border-2 border-purple-200 rounded-2xl p-4 shadow-xl relative overflow-hidden">
      <div className="relative" style={{ width: '100%' }}>
        <canvas ref={canvasRef} className="w-full h-auto block rounded-xl" />
        {/* Overlay de campos en % (solo page 0/1 para preview) */}
        <div className="pointer-events-none absolute inset-0" style={{ width: pageSize.w, height: pageSize.h }}>
          {campos.filter(c => (c.page ?? 0) === 0).map((c, idx) => {
            const left = (c.xPct || 0) * pageSize.w
            const top = (c.yPct || 0) * pageSize.h
            const width = (c.wPct || 0) * pageSize.w
            const height = (c.hPct || 0) * pageSize.h
            const align = c.align || 'left'
            const fontWeight = c.bold ? 700 : 500
            const size = (c.fontSize || 16) * (pageSize.w / 595) // escala aprox desde A4

            return (
              <div key={idx}
                   className="absolute text-gray-900"
                   style={{
                     left, top, width, height,
                     display: 'flex', alignItems: 'center',
                     justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
                     fontSize: size, fontWeight,
                     whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                   }}>
                {resolveFieldValue(c.key)}
              </div>
            )
          })}
        </div>
      </div>

      {!campos.length && (
        <p className="text-center text-slate-500 py-8">
          No hay campos configurados en <span className="font-semibold">Cursos/{'{cursoId}'}.constancia.campos</span>
        </p>
      )}

      <div className="text-center text-slate-600 mt-6">
        <p>Puerto Peñasco, Sonora</p>
        <p>{formatearFecha(constancia?.fechaGeneracion)}</p>
      </div>
    </div>
  )
}
