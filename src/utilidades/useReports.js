import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '../servicios/firebaseConfig';

/* —­­— cálculo rápido de bytes de una cadena base-64 —­­— */
const b64bytes = str =>
  (str.length * 3) / 4 - (str.endsWith('==') ? 2 : str.endsWith('=') ? 1 : 0);

export function useReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  /* —­­— listener en /Reportes ordenado por fecha desc —­­— */
  useEffect(() => {
    const q = query(collection(db, 'Reportes'), orderBy('fecha', 'desc'));
    const unsub = onSnapshot(
      q,
      snap => {
        setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  /* —­­— CRUD —­­— */
  const createReport = async (cursoId, data, imagenes = []) => {
    /* opcional: bloquear docs > 1 MB */
    const size =
      JSON.stringify({ ...data, cursoId, imagenes }).length +
      imagenes.reduce((n, d) => n + b64bytes(d), 0);
    if (size > 950_000) throw new Error('doc-too-big');

    await addDoc(collection(db, 'Reportes'), {
      cursoId,
      ...data,
      imagenes,
      fecha: new Date().toISOString(),
    });
  };

  const deleteReport = async reportId => {
    await deleteDoc(doc(db, 'Reportes', reportId));
  };

  return { reports, loading, createReport, deleteReport };
}
