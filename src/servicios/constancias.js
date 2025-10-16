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
    yPct: +(yPx / pageHeightPx).toFixed(6), // y medido desde arriba (coherente con tu editor)
    wPct: +(wPx / pageWidthPx).toFixed(6),
    hPct: +(hPx / pageHeightPx).toFixed(6),
  }
}

/** Crea/actualiza la configuración de constancias del curso (plantilla + campos en %) */
export async function setCursoConstancia(cursoId, { plantilla, campos }, usuarioEmail) {
  const refCurso = doc(db, 'Cursos', cursoId)
  await setDoc(refCurso, {
    constancia: {
      plantilla,        // { plantillaId, url, storagePath }
      campos,           // [{ key,label,page,xPct,yPct,wPct,hPct,fontSize,align,bold }, ...]
      actualizadoPor: usuarioEmail || 'desconocido',
      actualizadoEn: serverTimestamp(),
    }
  }, { merge: true })
}

/** Lee la configuración guardada en Cursos/{cursoId}.constancia */
export async function getConfigConstancia(cursoId) {
  const snap = await getDoc(doc(db, 'Cursos', cursoId))
  if (!snap.exists()) return null
  const data = snap.data()
  return data?.constancia || null
}

/** Sube el PDF a Storage y registra metadata en Cursos/{cursoId}/Constancias */
export async function subirYRegistrarConstancia(cursoId, pdfBytesOrBlob, participante, generadoPor) {
  const clean = s => String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '_')

  const filename = `${clean(participante?.folio || Date.now())}.pdf`
  const storagePath = `constancias/${cursoId}/${filename}`

  const sRef = ref(storage, storagePath)
  await uploadBytes(sRef, pdfBytesOrBlob, { contentType: 'application/pdf' })
  const url = await getDownloadURL(sRef)

  await addDoc(collection(db, 'Cursos', cursoId, 'Constancias'), {
    participante: {
      nombre: participante?.nombre || '',
      correo: participante?.correo || '',
      folio:  participante?.folio  || ''
    },
    url,
    storagePath,
    generadoPor: generadoPor || 'desconocido',
    createdAt: serverTimestamp()
  })

  return { url, storagePath }
}
