import { useState, useEffect } from 'react';
import { db } from '../servicios/firebaseConfig';
import {
  collection, query, orderBy,
  onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';

export function useParticipants() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'Alumnos'), orderBy('Nombres','asc'));
    const unsub = onSnapshot(q,
      snap => {
        const data = snap.docs.map(d => {
          const dd = d.data();
          return {
            id: d.id,
            nombre: dd.Nombres||'',
            apellidos:`${dd.ApellidoP||''} ${dd.ApellidoM||''}`.trim(),
            correo: dd.Correo||'',
            area: dd.Puesto||'',
            telefono: dd.Telefono||'',
            createdAt: dd.createdAt
          };
        });
        setParticipants(data);
        setLoading(false);
      },
      err => { setError(err); setLoading(false); }
    );
    return () => unsub();
  }, []);

  const addParticipant = data =>
    addDoc(collection(db,'Alumnos'), {
      Nombres: data.nombre,
      ApellidoP: data.apellidos.split(' ')[0]||'',
      ApellidoM: data.apellidos.split(' ')[1]||'',
      Correo: data.correo,
      Puesto: data.area,
      Telefono: data.telefono,
      createdAt: serverTimestamp()
    });

  const updateParticipant = (id,data) =>
    updateDoc(doc(db,'Alumnos',id),{
      Nombres: data.nombre,
      ApellidoP: data.apellidos.split(' ')[0]||'',
      ApellidoM: data.apellidos.split(' ')[1]||'',
      Correo: data.correo,
      Puesto: data.area,
      Telefono: data.telefono
    });

  const deleteParticipant = id =>
    deleteDoc(doc(db,'Alumnos',id));

  return { participants, loading, error, addParticipant, updateParticipant, deleteParticipant };
}
