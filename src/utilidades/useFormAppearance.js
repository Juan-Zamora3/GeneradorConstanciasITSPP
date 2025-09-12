import { useEffect, useRef, useState } from 'react';
import { db } from '@/servicios/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const DEFAULTS = {
  bgColor: '#0B5ED7',
  titleColor: '#0B1320',
  textColor: '#2C3E50',
  overlay: 0.35,
  bgImageUrl: '', // http(s) | blob: | data:
};

export function useFormAppearance(formId) {
  // Usa una copia para evitar referencias compartidas entre formularios
  const [appearance, setAppearance] = useState(() => ({ ...DEFAULTS }));
  const [loading, setLoading] = useState(true);
  const objectUrlRef = useRef(null);

  const setField = (key, value) =>
    setAppearance(prev => ({ ...prev, [key]: value }));

  // Cargar por ID y resetear al cambiar de form
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        if (!formId) {
          if (mounted) setAppearance({ ...DEFAULTS });
          return;
        }
        const snap = await getDoc(doc(db, 'formularios', formId));
        const data = snap.exists() ? (snap.data().appearance || {}) : {};
        // normaliza bgImageUrl
        let bg = data.bgImageUrl || '';
        if (bg && !/^https?:\/\//.test(bg) && !bg.startsWith('blob:') && !bg.startsWith('data:')) {
          bg = `data:image/png;base64,${bg}`;
        }
        if (mounted) setAppearance({ ...DEFAULTS, ...data, bgImageUrl: bg });
      } finally {
        setLoading(false);
      }
    }
    // reset duro + carga
    setAppearance({ ...DEFAULTS });
    load();

    return () => {
      mounted = false;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [formId]);

  const save = async () => {
    if (!formId) return;
    await setDoc(doc(db, 'formularios', formId), { appearance }, { merge: true });
  };

  const setBgImageFile = (file) => {
    // quitar imagen
    if (!file) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setField('bgImageUrl', '');
      return;
    }
    // reemplazar imagen local
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setField('bgImageUrl', url);
  };

  return { appearance, setField, setBgImageFile, save, loading, DEFAULTS };
}
