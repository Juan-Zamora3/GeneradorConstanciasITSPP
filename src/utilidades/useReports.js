import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../servicios/firebaseConfig';

export function useReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'Cursos'), snap => {
      const all = snap.docs.flatMap(d => {
        const rs = d.data().reportes || [];
        return rs.map(r => ({
          ...r,
          cursoId: d.id,
        }));
      });
      setReports(all);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const createReport = async (cursoId, reportData) => {
    const cRef = doc(db, 'Cursos', cursoId);
    await updateDoc(cRef, {
      reportes: arrayUnion({ 
        id: crypto.randomUUID(),
        ...reportData,
        fechaCreacion: new Date().toISOString()
      }),
    });
  };

  return { reports, loading, createReport };
}
