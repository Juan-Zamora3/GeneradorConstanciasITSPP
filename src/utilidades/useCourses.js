import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../servicios/firebaseConfig';

export function useCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'Cursos'), orderBy('fechaInicio', 'asc'));
    const unsub = onSnapshot(
      q,
      snap => {
        setCourses(
          snap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              titulo: data.cursoNombre || '',
              instructor: data.asesor || '',
              fechaInicio: data.fechaInicio || '',
              fechaFin: data.fechaFin || '',
              ubicacion: data.ubicacion || '',
              categoria: data.categoria || '',
              descripcion: data.descripcion || '',
              lista: (data.listas || [])[0] || '',
              estado: data.estado || '',
              participantes: data.asistencia?.[0]?.estudiantes || [],
              reportes: data.reportes || [],
              imageUrl: data.imageUrl || '',
            };
          })
        );
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const uploadImage = async file => {
    if (!file) return '';
    const fileRef = ref(storage, `courses/${Date.now()}-${file.name}`);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  };

  const createCourse = async (courseData, imageFile) => {
    const imageUrl = await uploadImage(imageFile);
    await addDoc(collection(db, 'Cursos'), {
      cursoNombre: courseData.titulo,
      asesor: courseData.instructor,
      fechaInicio: courseData.fechaInicio,
      fechaFin: courseData.fechaFin,
      ubicacion: courseData.ubicacion,
      categoria: courseData.categoria,
      descripcion: courseData.descripcion,
      listas: courseData.lista ? [courseData.lista] : [],
      estado: 'proximo',
      asistencia: [],
      reportes: [],
      imageUrl,
    });
  };

  const updateCourse = async (id, courseData) => {
    const cRef = doc(db, 'Cursos', id);
    await updateDoc(cRef, {
      cursoNombre: courseData.titulo,
      asesor: courseData.instructor,
      fechaInicio: courseData.fechaInicio,
      fechaFin: courseData.fechaFin,
      ubicacion: courseData.ubicacion,
      categoria: courseData.categoria,
      descripcion: courseData.descripcion,
      listas: courseData.lista ? [courseData.lista] : [],
    });
  };

  return { courses, loading, createCourse, updateCourse };
}
