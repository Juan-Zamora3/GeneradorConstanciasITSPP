import { useState, useEffect, useContext } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  where,
  getDocs,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../servicios/firebaseConfig';
import { AuthContext } from '../contexto/AuthContext';

export function useCourses() {
  const { usuario } = useContext(AuthContext);
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
              tipoCurso: data.tipoCurso || 'personal',
              theme: data.theme || {},
              encuestaId: data.encuestaId || '',
              encuestaLink: data.encuestaLink || '',
              formularioGrupos: data.formularioGrupos || {
                camposPreestablecidos: {
                  nombreEquipo: true,
                  nombreLider: true,
                  contactoEquipo: true,
                  categoria: true,
                  cantidadParticipantes: true,
                },
                preguntasPersonalizadas: []
              },
              grupos: data.grupos || []
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
    try {
      let imageUrl = '';
      if (imageFile) {
        const imageRef = ref(storage, `courses/${Date.now()}-${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

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
        tipoCurso: courseData.tipoCurso || 'personal',
        theme: courseData.theme || {},
        encuestaId: courseData.encuestaId || '',
        encuestaLink: courseData.encuestaLink || '',
        formularioGrupos: courseData.formularioGrupos || {
          camposPreestablecidos: {
            nombreEquipo: true,
            nombreLider: true,
            contactoEquipo: true,
            categoria: true,
            cantidadParticipantes: true,
          },
          preguntasPersonalizadas: []
        },
        grupos: []
      });

      // Crear notificación
      await addDoc(collection(db, 'Notificaciones'), {
        tipo: 'curso',
        titulo: 'Nuevo curso creado',
        mensaje: `Se ha creado el curso "${courseData.titulo}" con instructor ${courseData.instructor}`,
        datos: {
          cursoTitulo: courseData.titulo,
          instructor: courseData.instructor,
          fechaInicio: courseData.fechaInicio
        },
        leida: false,
        createdAt: serverTimestamp(),
        creadoPor: {
          email: usuario?.email || 'sistema@admin.com',
          nombre: usuario?.name || 'Usuario',
          uid: usuario?.email || 'sistema'
        }
      });
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
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
      tipoCurso: courseData.tipoCurso || 'personal',
      theme: courseData.theme || {},
      encuestaId: courseData.encuestaId || '',
      encuestaLink: courseData.encuestaLink || '',
      formularioGrupos: courseData.formularioGrupos || {
        camposPreestablecidos: {
          nombreEquipo: true,
          nombreLider: true,
          contactoEquipo: true,
          categoria: true,
          cantidadParticipantes: true,
        },
        preguntasPersonalizadas: []
      }
    };

    if (imageFile) {
      const imageUrl = await uploadImage(imageFile);
      updateData.imageUrl = imageUrl;
    }

    await updateDoc(cRef, updateData);
  };

  const deleteCourse = async (id) => {
    const cRef = doc(db, 'Cursos', id);

    // Eliminar encuestas asociadas al curso
    const q = query(collection(db, 'encuestas'), where('cursoId', '==', id));
    const encuestasSnap = await getDocs(q);
    for (const encDoc of encuestasSnap.docs) {
      // Eliminar respuestas de la encuesta
      const respSnap = await getDocs(collection(encDoc.ref, 'respuestas'));
      for (const r of respSnap.docs) {
        await deleteDoc(r.ref);
      }
      await deleteDoc(encDoc.ref);
    }

    await deleteDoc(cRef);
  };

  return { courses, loading, createCourse, updateCourse, deleteCourse };
}