import { db } from '@/servicios/firebaseConfig';
import {
  collection, doc, getDocs, query, where, writeBatch
} from 'firebase/firestore';

// Borra curso + encuestas referenciadas por campo cursoId
export async function deleteCourseAndSurveys(cursoId) {
  if (!cursoId) return;

  // 1) encuestas asociadas
  const encuestasRef = collection(db, 'encuestas');
  const q = query(encuestasRef, where('cursoId', '==', cursoId));
  const snap = await getDocs(q);

  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(d.ref));

  // 2) curso (colección 'Cursos')
  batch.delete(doc(db, 'Cursos', cursoId));

  await batch.commit();
}
