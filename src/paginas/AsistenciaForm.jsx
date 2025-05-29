// src/paginas/AsistenciaForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { db, storage } from '@/servicios/firebaseConfig';
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import fondo from '@/assets/FondoAPP.png';
import { FiUser, FiBriefcase, FiCamera } from 'react-icons/fi';

// Normaliza texto para comparar
const normalize = str =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

// Distancia Levenshtein
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

// Validación mínima
function validateForm({ nombre, puesto, foto }) {
  const errs = [];
  if (!nombre.trim() || nombre.trim().length < 5)
    errs.push('Escribe tu nombre completo (≥ 5 caracteres)');
  if (!puesto.trim() || puesto.trim().length < 3)
    errs.push('Indica tu puesto/cargo');
  if (!foto) errs.push('Adjunta la foto como evidencia');
  else if (foto.size > 5 * 1024 * 1024)
    errs.push('La imagen no debe exceder 5 MB');
  return errs;
}

export default function AsistenciaForm() {
  const { cursoId } = useParams();
  const [curso, setCurso]     = useState(null);
  const [form, setForm]       = useState({ nombre: '', puesto: '', foto: null });
  const [sending, setSending] = useState(false);
  const [done, setDone]       = useState(false);

  // 1) cargo el curso
  useEffect(() => {
    getDoc(doc(db, 'Cursos', cursoId))
      .then(s => s.exists() ? setCurso(s.data()) : setCurso({ error: 'Curso no encontrado' }))
      .catch(() => setCurso({ error: 'Error al consultar Firestore' }));
  }, [cursoId]);

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const onFile   = e => setForm(f => ({ ...f, foto: e.target.files[0] }));

  const submit = async e => {
    e.preventDefault();
    const errs = validateForm(form);
    if (errs.length) { toast.error(errs.join('\n')); return; }
    if (!curso || curso.error) { toast.error(curso?.error || 'Error al cargar curso'); return; }

    // 2) reviso fecha de fin
    const hoy = new Date(),
          fin = new Date(curso.fechaFin + 'T23:59:59');
    if (hoy > fin) {
      toast.warn('El registro ya no está disponible (curso finalizado).');
      return;
    }

    setSending(true);
    try {
      const listas = Array.isArray(curso.listas) ? curso.listas : [];

      // 3) intento buscar en Alumnos con campos exactos
      const partes = normalize(form.nombre).split(' ');
      // asumimos apellidoP como penúltima palabra
      const apellidoP = partes.length > 1 ? partes[partes.length - 2] : '';
      const nombres   = partes.slice(0, partes.length - 2).join(' ');

      let candidatos = [];
      if (nombres && apellidoP) {
        // query exacto
        const q = query(
          collection(db, 'Alumnos'),
          where('Nombres', '==', nombres),
          where('ApellidoP', '==', apellidoP)
        );
        const snapQ = await getDocs(q);
        candidatos = snapQ.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      // 4) si no hay ninguno exacto, bajamos todos y filtramos por Levenshtein
      if (!candidatos.length) {
        const todos = await getDocs(collection(db, 'Alumnos'));
        candidatos = todos.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(a => {
            const full = [a.Nombres, a.ApellidoP, a.ApellidoM]
              .filter(Boolean).join(' ');
            return levenshtein(normalize(full), normalize(form.nombre)) <= 2;
          });
      }

      // 5) de los candidatos, me quedo con el que esté en curso.listas
      const match = candidatos.find(a => listas.includes(a.id));
      if (!match) {
        toast.error('Tu nombre no coincide con la lista de este curso.');
        return;
      }

      // 6) subo foto
      const imgRef  = ref(storage, `asistencias/${cursoId}/${Date.now()}_${form.foto.name}`);
      await uploadBytes(imgRef, form.foto);
      const fotoURL = await getDownloadURL(imgRef);

      // 7) guardo en Firestore
      await updateDoc(doc(db, 'Cursos', cursoId), {
        asistencias: arrayUnion({
          id:        match.id,
          Nombres:   match.Nombres   || '',
          ApellidoP: match.ApellidoP || '',
          ApellidoM: match.ApellidoM || '',
          correo:    match.Correo     || match.email || '',
          puesto:    form.puesto,
          fotoURL,
          timestamp: new Date()
        })
      });

      toast.success('¡Asistencia registrada!');
      setDone(true);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar asistencia');
    } finally {
      setSending(false);
    }
  };

  if (!curso) return <p className="p-6 text-center text-gray-600">Cargando curso…</p>;
  if (curso.error) return <p className="p-6 text-center text-red-600">{curso.error}</p>;

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-cover bg-center"
            style={{ backgroundImage: `url(${fondo})` }}>
        <div className="bg-white bg-opacity-90 backdrop-blur-md shadow-2xl rounded-2xl p-8 max-w-sm text-center space-y-4">
          <h2 className="text-3xl font-extrabold text-blue-600">¡Listo!</h2>
          <p className="text-gray-700">
            Gracias por participar en <span className="font-semibold">“{curso.cursoNombre}”</span>
          </p>
          <button onClick={() => window.location.reload()}
                  className="mt-4 inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-full
                             hover:bg-blue-700 transition-shadow shadow-md hover:shadow-lg">
            Registrar otra
          </button>
        </div>
        <ToastContainer theme="colored" />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-cover bg-center"
          style={{ backgroundImage: `url(${fondo})` }}>
      <form onSubmit={submit}
            className="w-full max-w-lg bg-white bg-opacity-90 backdrop-blur-sm shadow-2xl
                       rounded-2xl p-8 space-y-6">
        <h1 className="text-4xl font-extrabold text-center text-blue-600">Registro de Asistencia</h1>
        <p className="text-center text-gray-600">
          Curso: <span className="font-semibold">{curso.cursoNombre}</span> | Cierra:{' '}
          <span className="font-semibold">{new Date(curso.fechaFin).toLocaleDateString('es-MX')}</span>
        </p>

        {/* Nombre */}
        <div className="relative">
          <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20}/>
          <input name="nombre" placeholder="Nombre completo"
                 value={form.nombre} onChange={onChange}
                 className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-3
                            focus:outline-none focus:ring-2 focus:ring-blue-400 transition"/>
        </div>

        {/* Puesto */}
        <div className="relative">
          <FiBriefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20}/>
          <input name="puesto" placeholder="Puesto / Cargo"
                 value={form.puesto} onChange={onChange}
                 className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-3
                            focus:outline-none focus:ring-2 focus:ring-blue-400 transition"/>
        </div>

        {/* Foto */}
        <label className="block">
          <span className="flex items-center text-gray-700 mb-1">
            <FiCamera className="mr-2 text-gray-500" size={18}/> Foto de asistencia
          </span>
          <input type="file" accept="image/*" onChange={onFile}
                 className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-full
                            file:border-0 file:bg-blue-600 file:text-white
                            hover:file:bg-blue-700 transition"/>
        </label>

        {/* Enviar */}
        <button type="submit" disabled={sending}
                className="w-full flex justify-center items-center space-x-2 bg-blue-600 text-white
                           rounded-full py-3 hover:bg-blue-700 transition-shadow
                           shadow-md hover:shadow-lg disabled:opacity-60">
          {sending
            ? 'Enviando…'
            : <>
                <FiCamera size={18}/>
                <span>Enviar asistencia</span>
              </>}
        </button>
      </form>

      <ToastContainer position="top-right" autoClose={3200}
                      hideProgressBar={false} newestOnTop closeOnClick
                      pauseOnFocusLoss draggable pauseOnHover theme="colored"/>
    </main>
  );
}
