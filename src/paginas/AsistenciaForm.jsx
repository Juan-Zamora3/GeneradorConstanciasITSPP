// src/paginas/AsistenciaForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, storage } from '@/servicios/firebaseConfig';
import {
  doc,
  getDoc,
  addDoc,
  collection
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import fondo from '@/assets/FondoAPP.png'; // tu imagen de fondo

/* ------------ helpers ------------ */
const normalize = str =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

function levenshtein(a, b) {
  if (a === b) return 0;
  const v0 = Array(b.length + 1).fill(0);
  const v1 = Array(b.length + 1).fill(0);
  for (let i = 0; i < v0.length; i++) v0[i] = i;
  for (let i = 0; i < a.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(
        v1[j] + 1,
        v0[j + 1] + 1,
        v0[j] + cost
      );
    }
    for (let j = 0; j < v0.length; j++) v0[j] = v1[j];
  }
  return v1[b.length];
}
/* ---------------------------------- */

export default function AsistenciaForm() {
  const { cursoId } = useParams();
  const [curso, setCurso]     = useState(null);
  const [form, setForm]       = useState({ nombre: '', puesto: '', foto: null });
  const [sending, setSending] = useState(false);
  const [done, setDone]       = useState(false);

  // Carga datos del curso al montar
  useEffect(() => {
    getDoc(doc(db, 'Cursos', cursoId)).then(snap => {
      if (snap.exists()) setCurso(snap.data());
      else setCurso({ error: 'Curso no encontrado' });
    });
  }, [cursoId]);

  const onChange = e =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const onFile = e =>
    setForm(f => ({ ...f, foto: e.target.files[0] }));

  const submit = async e => {
    e.preventDefault();
    if (!form.nombre || !form.puesto || !form.foto) {
      alert('Por favor completa todos los campos.');
      return;
    }
    if (!curso || curso.error) {
      alert('Curso no disponible.');
      return;
    }

    // 0) Verificar fecha de finalización
    const hoy = new Date();
    const fin  = new Date(curso.fechaFin + 'T23:59:59');
    if (hoy > fin) {
      alert('El período de registro para este curso ya finalizó.');
      return;
    }

    setSending(true);

    // 1) Obtener lista de IDs de alumnos autorizados
    const listas = curso.listas || [];

    // 2) Traer cada alumno para armar su nombre completo
    const nombres = await Promise.all(
      listas.map(id =>
        getDoc(doc(db, 'Alumnos', id)).then(s => {
          if (s.exists()) {
            const d = s.data();
            return `${d.Nombres} ${d.ApellidoP} ${d.ApellidoM}`;
          }
          return null;
        })
      )
    ).then(arr => arr.filter(Boolean));

    // 3) Validar coincidencia de nombre
    const inputNorm = normalize(form.nombre);
    const autorizado = nombres.some(fullName => {
      const norm = normalize(fullName);
      return levenshtein(inputNorm, norm) <= 2;
    });
    if (!autorizado) {
      alert('Tu nombre no coincide con la lista de este curso.');
      setSending(false);
      return;
    }

    // 4) Subir foto
    const imgRef = ref(
      storage,
      `asistencias/${cursoId}/${Date.now()}_${form.foto.name}`
    );
    await uploadBytes(imgRef, form.foto);
    const fotoURL = await getDownloadURL(imgRef);

    // 5) Guardar asistencia en subcolección
    await addDoc(
      collection(db, 'Cursos', cursoId, 'asistencias'),
      {
        nombre   : form.nombre,
        puesto   : form.puesto,
        fotoURL,
        timestamp: new Date()
      }
    );

    setDone(true);
    setSending(false);
  };

  /* ---------- UI ---------- */
  // Esperando datos del curso
  if (!curso) {
    return (
      <main
        className="min-h-screen flex items-center justify-center bg-gray-100"
      >
        <p>Cargando curso…</p>
      </main>
    );
  }

  // Si hay error al traer curso
  if (curso.error) {
    return (
      <main
        className="min-h-screen flex items-center justify-center bg-gray-100"
      >
        <p>{curso.error}</p>
      </main>
    );
  }

  // Pantalla de éxito
  if (done) {
    return (
      <main
        className="min-h-screen flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: `url(${fondo})` }}
      >
        <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-8 text-center max-w-sm w-full">
          <h2 className="text-2xl font-bold text-blue-600 mb-4">
            ¡Asistencia registrada!
          </h2>
          <p className="text-gray-700 mb-6">
            Gracias por participar en "{curso.cursoNombre}".
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Registrar otra
          </button>
        </div>
      </main>
    );
  }

  // Formulario
  return (
    <main
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${fondo})` }}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-white bg-opacity-90 shadow-lg rounded-lg p-8 space-y-6"
      >
        <h1 className="text-2xl font-bold text-center text-blue-600">
          Registro de Asistencia
        </h1>
        <p className="text-center text-gray-700">
          Curso: {curso.cursoNombre}  
          <br />
          Finaliza: {new Date(curso.fechaFin).toLocaleDateString('es-MX')}
        </p>

        <input
          name="nombre"
          placeholder="Nombre completo"
          value={form.nombre}
          onChange={onChange}
          className="w-full border rounded px-4 py-2 focus:outline-blue-600"
        />

        <input
          name="puesto"
          placeholder="Puesto / Cargo"
          value={form.puesto}
          onChange={onChange}
          className="w-full border rounded px-4 py-2 focus:outline-blue-600"
        />

        <input
          type="file"
          accept="image/*"
          onChange={onFile}
          className="w-full text-gray-700
                     file:mr-4 file:py-2 file:px-4
                     file:rounded file:border-0
                     file:bg-blue-600 file:text-white
                     hover:file:bg-blue-700"
        />

        <button
          type="submit"
          disabled={sending}
          className="w-full bg-blue-600 text-white rounded py-2
                     hover:bg-blue-700 disabled:opacity-50"
        >
          {sending ? 'Enviando…' : 'Enviar'}
        </button>
      </form>
    </main>
  );
}
