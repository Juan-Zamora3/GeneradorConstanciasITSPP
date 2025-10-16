import React, { useEffect, useState, useContext } from 'react'
import { AuthContext } from '../contexto/AuthContext'
import { db, storage } from '../servicios/firebaseConfig'
import { collection, addDoc, onSnapshot, serverTimestamp, deleteDoc, doc, query, orderBy } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { FiLayers, FiFileText, FiAlertCircle, FiPlus } from 'react-icons/fi'
import { Link } from 'react-router-dom'

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/build/pdf.mjs'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker'
GlobalWorkerOptions.workerPort = new pdfjsWorker()

const API_BASE = import.meta.env.VITE_API_BASE || '' // en dev: http://localhost:4000

export default function Plantillas() {
  const { usuario } = useContext(AuthContext)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [plantillas, setPlantillas] = useState([])
  const [thumbs, setThumbs] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [nombre, setNombre] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'Plantillas'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setPlantillas(list)
    })
    return () => unsub()
  }, [])

  const handleFileChange = async (e) => {
    setError('')
    const f = e.target.files?.[0]
    if (!f) return setFile(null)
    if (f.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF.')
      return
    }
    setFile(f)
  }

  const handleUpload = async (f = file, providedName = null) => {
    if (!f) return
    try {
      setUploading(true)
      setError('')
      const path = `plantillas/${Date.now()}_${f.name.replace(/\s+/g, '_')}`
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
      setError('Error al subir la plantilla')
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
      setError('No se pudo eliminar la plantilla')
    }
  }

  const generateThumbnail = async (pdfUrl) => {
    try {
      const proxied = `${API_BASE}/proxy-pdf?url=${encodeURIComponent(pdfUrl)}`
      const ab = await fetch(proxied).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.arrayBuffer()
      })
      const pdf = await getDocument({ data: ab, isEvalSupported: false }).promise
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

  useEffect(() => {
    let alive = true
    ;(async () => {
      for (const p of plantillas) {
        if (!thumbs[p.id] && p.url) {
          const dataUrl = await generateThumbnail(p.url)
          if (alive && dataUrl) setThumbs(t => ({ ...t, [p.id]: dataUrl }))
        }
      }
    })()
    return () => { alive = false }
  }, [plantillas])

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <FiLayers className="text-teal-600" /> Plantillas
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setShowModal(true); setError(''); setFile(null); setNombre(''); }}
            className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 flex items-center"
          >
            <FiPlus className="mr-1"/> Crear plantilla
          </button>
        </div>
      </div>

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
                <input type="file" accept="application/pdf" onChange={handleFileChange} className="block w-full" />
                {file && <p className="text-xs text-gray-500 mt-1">Seleccionado: {file.name}</p>}
                {error && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><FiAlertCircle/> {error}</p>
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
                className={`px-4 py-2 rounded text-white ${(!file || uploading || !nombre.trim()) ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`}
              >
                {uploading ? 'Creando…' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FiFileText className="text-teal-600"/> Plantillas guardadas
          </h3>
        </div>
        {!plantillas.length ? (
          <div className="text-center text-gray-500 py-6">Aún no hay plantillas cargadas.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {plantillas.map((p) => (
              <div key={p.id} className="rounded-xl border border-gray-200 shadow-sm hover:shadow transition">
                <div className="w-full h-40 bg-gray-100 rounded-t-xl overflow-hidden flex items-center justify-center">
                  {thumbs[p.id] ? (
                    <img src={thumbs[p.id]} alt={`Miniatura ${p.nombre}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-gray-400">
                      <FiFileText className="text-4xl" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.nombre}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Link to={`/plantillas/${p.id}`} className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs">Editar</Link>
                    <button onClick={() => handleDelete(p)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs">Eliminar</button>
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
