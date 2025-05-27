
import { useState, useEffect, useContext } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../servicios/firebaseConfig';
import { AuthContext } from '../contexto/AuthContext';

/* —­­— cálculo rápido de bytes de una cadena base-64 —­­— */
const b64bytes = str =>
  (str.length * 3) / 4 - (str.endsWith('==') ? 2 : str.endsWith('=') ? 1 : 0);

export function useReports() {
  const { usuario } = useContext(AuthContext);
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

  /* —­­— helpers comunes —­­— */
  const tooBig = (data, imagenes) => {
    const size =
      JSON.stringify({ ...data, imagenes }).length +
      imagenes.reduce((n, d) => n + b64bytes(d), 0);
    return size > 950_000;
  };

  /* —­­— CRUD —­­— */
  const createReport = async (cursoId, data, imagenes = []) => {
    if (tooBig(data, imagenes)) throw new Error('doc-too-big');

    await addDoc(collection(db, 'Reportes'), {
      cursoId,
      ...data,
      imagenes,
      fecha: new Date().toISOString(),
    });

    // Crear notificación
    await addDoc(collection(db, 'Notificaciones'), {
      tipo: 'reporte',
      titulo: 'Nuevo reporte creado',
      mensaje: `Se ha creado un reporte "${data.titulo}" de tipo ${data.tipo}`,
      datos: {
        reporteTitulo: data.titulo,
        tipo: data.tipo,
        cursoId: cursoId
      },
      leida: false,
      createdAt: serverTimestamp(),
      creadoPor: {
        email: usuario?.email || 'sistema@admin.com',
        nombre: usuario?.name || 'Usuario',
        uid: usuario?.email || 'sistema'
      }
    });
  };

  const updateReport = async (reportId, data, imagenes = []) => {
    if (tooBig(data, imagenes)) throw new Error('doc-too-big');

    await updateDoc(doc(db, 'Reportes', reportId), {
      ...data,
      imagenes,
      // fecha: data.fecha (mantenemos la que venga del form)
    });
  };

  const deleteReport = async reportId => {
    await deleteDoc(doc(db, 'Reportes', reportId));
  };

  return {
    reports,
    loading,
    createReport,
    updateReport,
    deleteReport,
  };
}
