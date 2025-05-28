import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { db, storage } from '@/servicios/firebaseConfig';
import {
  doc, getDoc, addDoc, collection
} from 'firebase/firestore';
import {
  ref, uploadBytes, getDownloadURL
} from 'firebase/storage';

/* ------------ helpers ------------ */
const normalize = str =>
  str
    .toLowerCase()
    .normalize('NFD')                // separa diacríticos
    .replace(/\p{Diacritic}/gu, '')  // elimina diacríticos
    .replace(/\s+/g, ' ')            // colapsa espacios
    .trim();

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const v0 = Array(b.length + 1).fill(0);
  const v1 = Array(b.length + 1).fill(0);
  for (let i = 0; i < v0.length; i++) v0[i] = i;

  for (let i = 0; i < a.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(
        v1[j] + 1,      // inserción
        v0[j + 1] + 1,  // eliminación
        v0[j] + cost    // sustitución
      );
    }
    for (let j = 0; j < v0.length; j++) v0[j] = v1[j];
  }
  return v1[b.length];
}
/* ---------------------------------- */

export default function AsistenciaForm() {
  const { cursoId } = useParams();

  const [form, setForm]       = useState({ nombre:'', puesto:'', foto:null });
  const [sending, setSending] = useState(false);
  const [done, setDone]       = useState(false);

  const onChange = e =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const onFile = e =>
    setForm(f => ({ ...f, foto: e.target.files[0] }));

  const submit = async e => {
    e.preventDefault();
    if (!form.nombre || !form.puesto || !form.foto) {
      alert('Completa todos los campos');
      return;
    }
    setSending(true);

    /* 1. Traer el curso */
    const snap = await getDoc(doc(db, 'Cursos', cursoId));
    if (!snap.exists()) {
      alert('Curso no encontrado');
      setSending(false);
      return;
    }
    const { listas = [] } = snap.data();

    /* 2. Normalizar nombres y verificar */
    const inputNorm = normalize(form.nombre);
    const autorizado = listas.some(n => {
      const norm = normalize(n);
      const dist = levenshtein(inputNorm, norm);
      return dist <= 2;        // permite 0-2 diferencias
    });

    if (!autorizado) {
      alert('Tu nombre no coincide con la lista de este curso');
      setSending(false);
      return;
    }

    /* 3. Subir foto */
    const imgRef = ref(
      storage,
      `asistencias/${cursoId}/${Date.now()}_${form.foto.name}`
    );
    await uploadBytes(imgRef, form.foto);
    const fotoURL = await getDownloadURL(imgRef);

    /* 4. Guardar asistencia */
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
  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white shadow rounded-lg p-8 text-center max-w-sm w-full">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">
            ¡Asistencia registrada!
          </h2>
          <p className="text-sm text-gray-600">
            Gracias por tu participación.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-white shadow-lg rounded-lg p-6 space-y-4"
      >
        <h1 className="text-xl font-semibold text-center text-blue-600">
          Registro de Asistencia
        </h1>

        <input
          name="nombre"
          placeholder="Nombre completo"
          value={form.nombre}
          onChange={onChange}
          className="w-full border rounded px-3 py-2 focus:outline-blue-600"
        />

        <input
          name="puesto"
          placeholder="Puesto / Cargo"
          value={form.puesto}
          onChange={onChange}
          className="w-full border rounded px-3 py-2 focus:outline-blue-600"
        />

        <input
          type="file"
          accept="image/*"
          onChange={onFile}
          className="w-full border rounded px-3 py-2 text-sm
                     file:mr-4 file:py-2 file:px-4 file:rounded file:border-0
                     file:bg-blue-600 file:text-white hover:file:bg-blue-700"
        />

        <button
          type="submit"
          disabled={sending}
          className="w-full bg-blue-600 text-white rounded py-2
                     hover:bg-blue-700 disabled:opacity-60"
        >
          {sending ? 'Enviando…' : 'Enviar'}
        </button>
      </form>
    </main>
  );
}
