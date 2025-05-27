// src/utilidades/useUsuarios.js
import { useState, useEffect } from 'react'
import { auth, db } from '../servicios/firebaseConfig'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore'

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    const col = collection(db, 'Usuarios')
    const unsub = onSnapshot(col, snap => {
      const list = snap.docs.map(d => ({
        id:        d.id,
        nombre:    d.data().nombre,
        correo:    d.data().correo,
        role:      d.data().role,
        password:  d.data().password,     // si quieres leerla
        createdAt: d.data().createdAt
      }))
      setUsuarios(list)
      setLoading(false)
    }, err => {
      setError(err)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const addUsuario = async ({ nombre, correo, password }) => {
    // 1) Crear en Auth
    const { user } = await createUserWithEmailAndPassword(auth, correo, password)
    // 2) Guardar en Firestore, incluyendo password
    await setDoc(doc(db, 'Usuarios', user.email), {
      nombre,
      correo,
      role: 'user',
      password,             // <-- ahora se guarda
      createdAt: serverTimestamp()
    })
  }

  const removeUsuario = id =>
    deleteDoc(doc(db, 'Usuarios', id))

  return { usuarios, loading, error, addUsuario, removeUsuario }
}
