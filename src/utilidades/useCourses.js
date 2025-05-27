import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
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
              lista: Array.isArray(data.listas) ? data.listas : [],
              estado: data.estado || '',
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
      listas: Array.isArray(courseData.lista) ? courseData.lista : [],
      estado: 'proximo',
      reportes: [],
      imageUrl,
    });
  };

  const updateCourse = async (id, courseData, imageFile) => {
    const cRef = doc(db, 'Cursos', id);
    const updateData = {
      cursoNombre: courseData.titulo,
      asesor: courseData.instructor,
      fechaInicio: courseData.fechaInicio,
      fechaFin: courseData.fechaFin,
      ubicacion: courseData.ubicacion,
      categoria: courseData.categoria,
      descripcion: courseData.descripcion,
      listas: Array.isArray(courseData.lista) ? courseData.lista : [],
    };

    if (imageFile) {
      const imageUrl = await uploadImage(imageFile);
      updateData.imageUrl = imageUrl;
    }

    await updateDoc(cRef, updateData);
  };

  const deleteCourse = async (id) => {
    const cRef = doc(db, 'Cursos', id);
    await deleteDoc(cRef);
  };

  return { courses, loading, createCourse, updateCourse, deleteCourse };
}