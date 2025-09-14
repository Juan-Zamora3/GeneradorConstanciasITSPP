import { db } from '@/servicios/firebaseConfig';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch
} from 'firebase/firestore';

// Borra curso + encuestas referenciadas por campo cursoId
export async function deleteCourseAndSurveys(cursoId) {
  if (!cursoId) return;

  // 1) encuestas asociadas
  const encuestasRef = collection(db, 'encuestas');
  const q = query(encuestasRef, where('cursoId', '==', cursoId));
  const snap = await getDocs(q);

  const batch = writeBatch(db);

  for (const encDoc of snap.docs) {
    // borrar respuestas de la encuesta
    const resSnap = await getDocs(collection(encDoc.ref, 'respuestas'));
    resSnap.forEach((r) => batch.delete(r.ref));
    // borrar encuesta
    batch.delete(encDoc.ref);
  }

  // 2) curso (colección 'Cursos')
  batch.delete(doc(db, 'Cursos', cursoId));

  await batch.commit();
}
