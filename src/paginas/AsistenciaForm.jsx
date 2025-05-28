// src/paginas/AsistenciaForm.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { db, storage } from '@/servicios/firebaseConfig';
import { addDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function AsistenciaForm() {
  const { cursoId } = useParams();
  const nav = useNavigate();

  const [form, setForm] = useState({ nombre:'', puesto:'', foto:null });
  const [sending, setSending] = useState(false);

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleFile   = e => setForm({ ...form, foto: e.target.files[0] });

  const submit = async e => {
    e.preventDefault();
    if (!form.nombre || !form.puesto || !form.foto) return alert('Falta info');
    setSending(true);

    // 1. Sube foto
    const imgRef = ref(
      storage,
      `asistencias/${cursoId}/${Date.now()}_${form.foto.name}`
    );
    await uploadBytes(imgRef, form.foto);
    const fotoURL = await getDownloadURL(imgRef);

    // 2. Guarda registro
    await addDoc(collection(db, 'Asistencias'), {
      cursoId,
      nombre : form.nombre,
      puesto : form.puesto,
      fotoURL,
      timestamp: new Date()
    });

    alert('¡Asistencia registrada!');
    nav('/'); // o donde quieras volver
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-white shadow p-6 rounded space-y-4"
      >
        <h1 className="text-xl font-semibold text-center">
          Registro de asistencia
        </h1>

        <input
          name="nombre"
          placeholder="Nombre completo"
          value={form.nombre}
          onChange={handleChange}
          className="input"
        />

        <input
          name="puesto"
          placeholder="Puesto / Cargo"
          value={form.puesto}
          onChange={handleChange}
          className="input"
        />

        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="input"
        />

        <button
          type="submit"
          disabled={sending}
          className="btn-primary w-full"
        >
          {sending ? 'Enviando…' : 'Enviar'}
        </button>
      </form>
    </main>
  );
}
