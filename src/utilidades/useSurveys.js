// src/utilidades/useSurveys.js
import { useState, useCallback } from 'react';
import { db } from '../servicios/firebaseConfig';
import {
  collection, doc, addDoc, getDoc, getDocs, query, where, updateDoc,
  serverTimestamp
} from 'firebase/firestore';

const ENCUESTAS = 'encuestas';

export function useSurveys() {
  const [loading, setLoading] = useState(false);

  const getByCourse = useCallback(async (cursoId) => {
    const q = query(collection(db, ENCUESTAS), where('cursoId', '==', cursoId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }, []);

  const getById = useCallback(async (encuestaId) => {
    const ref = doc(db, ENCUESTAS, encuestaId);
    const snap = await getDoc(ref);
    return snap.exists() ? ({ id: snap.id, ...snap.data() }) : null;
  }, []);

  const createForCourse = useCallback(
    async ({ cursoId, titulo, descripcion, preguntas, theme, user }) => {
      setLoading(true);
      try {
        const ref = await addDoc(collection(db, ENCUESTAS), {
          cursoId,
        titulo: titulo || 'Registro de Grupos',
        descripcion: descripcion || '',
        preguntas: preguntas || [],
        theme: theme || {},
        creadoPor: user?.uid || null,
        creadoEn: serverTimestamp(),
        link: '' // luego lo rellenamos
        });

      // Detecta si la app usa HashRouter (window.location.hash comienza con "#/")
      const usesHashRouter = window.location.hash?.startsWith('#/');
      const base = window.location.origin + (usesHashRouter ? '/#' : '');
      const link = `${base}/registro/${ref.id}`;

      await updateDoc(ref, { link });
      return { id: ref.id, link };
    } finally {
      setLoading(false);
    }
  }, []);

  const saveResponse = useCallback(async (encuestaId, payload) => {
    // payload: { preset: {...}, custom: {...} }
    const sub = collection(doc(db, ENCUESTAS, encuestaId), 'respuestas');
    await addDoc(sub, { ...payload, submittedAt: serverTimestamp() });
  }, []);

  return { loading, getByCourse, getById, createForCourse, saveResponse };
}
