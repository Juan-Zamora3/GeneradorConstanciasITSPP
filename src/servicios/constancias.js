// src/servicios/constancias.js
import { db, storage } from './firebaseConfig'
import {
  doc, setDoc, addDoc, collection, serverTimestamp, getDoc
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

/** Convierte un rectángulo en píxeles a porcentajes (0..1) relativos a la página */
export function toPctRect({ xPx, yPx, wPx, hPx }, { pageWidthPx, pageHeightPx }) {
  return {
    xPct: +(xPx / pageWidthPx).toFixed(6),
    yPct: +(yPx / pageHeightPx).toFixed(6), // y medido desde arriba
    wPct: +(wPx / pageWidthPx).toFixed(6),
    hPct: +(hPx / pageHeightPx).toFixed(6),
  }
}

/**
 * Crea/actualiza la configuración de constancias del curso:
 *   Cursos/{cursoId}.constancia = { plantilla, campos, ... }
 * - plantilla: { plantillaId, url, storagePath, nombre? }
 * - campos:    [{ key,label,page,xPct,yPct,wPct,hPct,fontSize,align,bold }, ...]
 */
export async function setCursoConstancia(
  cursoId,
  { plantilla, campos },
  usuarioEmail
) {
  const refCurso = doc(db, 'Cursos', cursoId)
  // Incluimos 'nombre' si viene desde la colección Plantillas
  const plantillaSan = plantilla
    ? {
        plantillaId: plantilla.plantillaId ?? plantilla.id ?? null,
        url: plantilla.url ?? null,
        storagePath: plantilla.storagePath ?? null,
        nombre: plantilla.nombre ?? null,
      }
    : null

  await setDoc(
    refCurso,
    {
      constancia: {
        plantilla: plantillaSan,
        campos: Array.isArray(campos) ? campos : [],
        actualizadoPor: usuarioEmail || 'desconocido',
        actualizadoEn: serverTimestamp(),
      },
    },
    { merge: true }
  )
}

/** Lee la configuración guardada en Cursos/{cursoId}.constancia */
export async function getConfigConstancia(cursoId) {
  if (!cursoId) return null
  const snap = await getDoc(doc(db, 'Cursos', cursoId))
  if (!snap.exists()) return null
  return snap.data()?.constancia || null
}

/**
 * Sube un PDF a Storage y registra metadata en:
 *   Cursos/{cursoId}/Constancias/{autoId}
 *
 * @param {string} cursoId
 * @param {Blob|Uint8Array|ArrayBuffer} pdfBytesOrBlob
 * @param {{nombre?:string, correo?:string, email?:string, folio?:string}} participante
 * @param {string} generadoPor
 * @returns {{ url: string, storagePath: string, docId: string }}
 */
export async function subirYRegistrarConstancia(
  cursoId,
  pdfBytesOrBlob,
  participante,
  generadoPor
) {
  const clean = (s) =>
    String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_]+/g, '_')

  // Acepta también ArrayBuffer
  let data = pdfBytesOrBlob
  if (pdfBytesOrBlob instanceof ArrayBuffer) {
    data = new Uint8Array(pdfBytesOrBlob)
  }

  const folio = participante?.folio || Date.now()
  const filename = `${clean(folio)}.pdf`
  const storagePath = `constancias/${cursoId}/${filename}`

  const sRef = ref(storage, storagePath)
  await uploadBytes(sRef, data, { contentType: 'application/pdf' })
  const url = await getDownloadURL(sRef)

  const docRef = await addDoc(collection(db, 'Cursos', cursoId, 'Constancias'), {
    participante: {
      nombre: participante?.nombre || '',
      // Normaliza correo/email
      correo: participante?.correo || participante?.email || '',
      folio: participante?.folio || '',
    },
    url,
    storagePath,
    generadoPor: generadoPor || 'desconocido',
    createdAt: serverTimestamp(),
  })

  return { url, storagePath, docId: docRef.id }
}
