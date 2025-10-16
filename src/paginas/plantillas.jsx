import React, { useEffect, useState, useContext } from 'react'
import { AuthContext } from '../contexto/AuthContext'
import { db, storage } from '../servicios/firebaseConfig'
import {
  collection, addDoc, onSnapshot, serverTimestamp, deleteDoc, doc, query, orderBy
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { FiLayers, FiFileText, FiAlertCircle, FiPlus } from 'react-icons/fi'
import { Link } from 'react-router-dom'

// pdf.js (con fallback para Render)
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/build/pdf.mjs'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker'
try {
  GlobalWorkerOptions.workerPort = new pdfjsWorker()
} catch {
  GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs'
}

export default function Plantillas() {
  const { usuario } = useContext(AuthContext)

  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [plantillas, setPlantillas] = useState([])
  const [thumbs, setThumbs] = useState({}) // { [id]: dataURL }
  const [showModal, setShowModal] = useState(false)
  const [nombre, setNombre] = useState('')

  // Cargar listado de plantillas
  useEffect(() => {
    const q = query(collection(db, 'Plantillas'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(
      q,
      snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setPlantillas(list)
      },
      err => {
        console.error(err)
        setError('No se pudieron cargar las plantillas.')
      }
    )
    return () => unsub()
  }, [])

  const handleFileChange = (e) => {
    setError('')
    const f = e.target.files?.[0]
    if (!f) {
      setFile(null)
      return
    }
    if (f.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF.')
      setFile(null)
      return
    }
    setFile(f)
  }

  const handleUpload = async (f = file, providedName = null) => {
    if (!f) return
    try {
      setUploading(true)
      setError('')

      const safeName = f.name.replace(/\s+/g, '_')
      const path = `plantillas/${Date.now()}_${safeName}`
      const storageRef = ref(storage, path)

      await uploadBytes(storageRef, f, { contentType: 'application/pdf' })
      const url = await getDownloadURL(storageRef)

      await addDoc(collection(db, 'Plantillas'), {
        nombre: (providedName && providedName.trim()) ? providedName.trim() : f.name,
        url,
        storagePath: path,
        createdAt: serverTimestamp(),
        creadoPor: usuario?.correo || usuario?.email || 'desconocido',
      })

      setFile(null)
      setNombre('')
      setShowModal(false)
    } catch (err) {
      console.error(err)
      setError('Error al subir la plantilla.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (plantilla) => {
    const ok = window.confirm(`¿Eliminar plantilla "${plantilla.nombre}"?`)
    if (!ok) return
    try {
      if (plantilla.storagePath) {
        await deleteObject(ref(storage, plantilla.storagePath))
      }
      await deleteDoc(doc(db, 'Plantillas', plantilla.id))
    } catch (err) {
      console.error(err)
      setError('No se pudo eliminar la plantilla.')
    }
  }

  // Miniatura PDF: descarga como ArrayBuffer (funciona en Render)
  const generateThumbnail = async (pdfUrl) => {
    try {
      const ab = await fetch(pdfUrl, { mode: 'cors', cache: 'no-store' }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.arrayBuffer()
      })
      const loadingTask = getDocument({
        data: ab,
        isEvalSupported: false,
        useWorkerFetch: false,
        useSystemFonts: true
      })
      const pdf = await loadingTask.promise
      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 0.35 })
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvasContext: ctx, viewport }).promise
      return canvas.toDataURL('image/png')
    } catch (err) {
      console.warn('No se pudo generar miniatura PDF:', err)
      return null
    }
  }

  // Generar miniaturas solo para las plantillas que aún no la tienen
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const pendientes = plantillas.filter(p => !thumbs[p.id] && p.url)
      if (!pendientes.length) return

      const pares = await Promise.all(
        pendientes.map(async (p) => {
          const dataUrl = await generateThumbnail(p.url)
          return [p.id, dataUrl]
        })
      )

      if (cancelled) return
      setThumbs(prev => {
        const next = { ...prev }
        for (const [id, dataUrl] of pares) {
          if (dataUrl) next[id] = dataUrl
        }
        return next
      })
    })()

    return () => { cancelled = true }
  }, [plantillas, thumbs])

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <FiLayers className="text-teal-600" /> Plantillas
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setShowModal(true); setError(''); setFile(null); setNombre(''); }}
            className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 flex items-center"
          >
            <FiPlus className="mr-1" /> Crear plantilla
          </button>
        </div>
      </div>

      {/* Modal crear plantilla */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-5">
            <h3 className="text-lg font-semibold mb-3">Crear plantilla</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la plantilla</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Ej. Constancia Oficial 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Archivo PDF</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="block w-full"
                />
                {file && <p className="text-xs text-gray-500 mt-1">Seleccionado: {file.name}</p>}
                {error && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <FiAlertCircle /> {error}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setShowModal(false); setFile(null); setNombre(''); setError(''); }}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleUpload(file, nombre)}
                disabled={!file || uploading || !nombre.trim()}
                className={`px-4 py-2 rounded text-white ${(!file || uploading || !nombre.trim())
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700'}`}
              >
                {uploading ? 'Creando…' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GRID DE CARDS */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FiFileText className="text-teal-600" /> Plantillas guardadas
          </h3>
        </div>

        {!plantillas.length ? (
          <div className="text-center text-gray-500 py-6">Aún no hay plantillas cargadas.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {plantillas.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-gray-200 shadow-sm hover:shadow transition"
              >
                <div className="w-full h-40 bg-gray-100 rounded-t-xl overflow-hidden flex items-center justify-center">
                  {thumbs[p.id] ? (
                    <img
                      src={thumbs[p.id]}
                      alt={`Miniatura ${p.nombre}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-gray-400">
                      <FiFileText className="text-4xl" />
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <p className="text-sm font-medium text-gray-800 truncate" title={p.nombre}>
                    {p.nombre}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Link
                      to={`/plantillas/${p.id}`}
                      className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(p)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
