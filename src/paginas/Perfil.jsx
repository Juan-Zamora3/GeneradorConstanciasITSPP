import React, { useState, useContext, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexto/AuthContext'
import { FaUser, FaEnvelope, FaLock, FaHistory, FaCamera, FaEdit } from 'react-icons/fa'

// 🔗 Firebase ------------------------------------------------------------
import {
  doc,
  updateDoc,
  onSnapshot,
  setDoc          // por si el doc aún no existe
} from 'firebase/firestore'
import { db, storage } from '../servicios/firebaseConfig'
import {
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage'
// ------------------------------------------------------------------------

export default function Perfil () {
  const navigate = useNavigate()
  const { usuario } = useContext(AuthContext)
  const [cargando, setCargando] = useState(false)
  const [imagenPreview, setImagenPreview] = useState(null)
  const [imagenFile, setImagenFile] = useState(null)
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })
  const fileInputRef = useRef(null)

  const [perfil, setPerfil] = useState({
    nombre: '',
    apellidos: '',
    correo: '',
    contrasenaActual: '••••••••',
    contrasenaNueva: '',
    confirmarContrasena: ''
  })

  /** --------------------------------------------------
   *  CARGAR PERFIL DESDE FIRESTORE
   *  -------------------------------------------------- */
  useEffect(() => {
    if (!usuario) {
      navigate('/login', { replace: true })
      return
    }

    const uid = usuario.email          // <‑‑ usas email como ID de doc
    const userRef = doc(db, 'Usuarios', uid)

    // 1) Suscripción en tiempo real
    const unsub = onSnapshot(userRef, snap => {
      if (snap.exists()) {
        const data = snap.data()
        setPerfil(prv => ({
          ...prv,
          nombre: data.name || '',
          apellidos: data.apellidos || '',
          correo: data.email || ''
        }))
        if (data.imagen) setImagenPreview(data.imagen)
      } else {
        // crea el doc vacío si no existe
        setDoc(userRef, {
          email: usuario.email,
          name: usuario.displayName || '',
          imagen: ''
        })
      }
    })

    return () => unsub()
  }, [usuario, navigate])

  /** --------------------------------------------------
   *  HANDLERS
   *  -------------------------------------------------- */
  const handleInputChange = e => {
    const { name, value } = e.target
    if (name === 'contrasenaActual') return
    setPerfil({ ...perfil, [name]: value })
  }

  const handleImagenChange = e => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0]
      setImagenFile(file)
      const reader = new FileReader()
      reader.onload = ev => setImagenPreview(ev.target.result)
      reader.readAsDataURL(file)
    }
  }

  const abrirSelectorImagen = () => fileInputRef.current.click()

  /** --------------------------------------------------
   *  GUARDAR CAMBIOS
   *  -------------------------------------------------- */
  const handleSubmit = async e => {
    e.preventDefault()
    setCargando(true)

    try {
      // Validar contraseñas
      if (perfil.contrasenaNueva && perfil.contrasenaNueva !== perfil.confirmarContrasena) {
        throw new Error('Las contraseñas no coinciden')
      }

      const uid = usuario.email
      const userRef = doc(db, 'Usuarios', uid)

      // 1) si hay nueva imagen súbela a Storage
      let imagenURL = null
      if (imagenFile) {
        const imgRef = ref(storage, `avatars/${uid}`)
        await uploadBytes(imgRef, imagenFile)
        imagenURL = await getDownloadURL(imgRef)
      }

      // 2) Construir datos a actualizar
      const dataToUpdate = {
        name: perfil.nombre,
        apellidos: perfil.apellidos,
        email: perfil.correo
      }
      if (imagenURL) dataToUpdate.imagen = imagenURL

      await updateDoc(userRef, dataToUpdate)

      setMensaje({ texto: 'Perfil actualizado correctamente', tipo: 'exito' })
      // limpiar contraseñas
      setPerfil(p => ({ ...p, contrasenaNueva: '', confirmarContrasena: '' }))
      setImagenFile(null)
    } catch (err) {
      console.error(err)
      setMensaje({ texto: err.message || 'Error al guardar', tipo: 'error' })
    } finally {
      setCargando(false)
    }
  }

  /* ----------------------------- RENDER -------------------------------- */
  if (!usuario) return null

  return (
    <div className='p-6 pb-20'>
      <h2 className='text-2xl font-semibold mb-6'>Perfil de Usuario</h2>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* FOTO + ACTIVIDAD */}
        <div>
          <div className='bg-white rounded-xl shadow overflow-hidden mb-6'>
            <div className='bg-blue-500 h-24' />
            <div className='px-6 pb-6 relative'>
              <div className='w-24 h-24 rounded-full bg-white p-1 overflow-hidden -mt-12 mx-auto mb-4 relative'>
                {imagenPreview
                  ? <img src={imagenPreview} alt='Foto de perfil' className='w-full h-full object-cover rounded-full' />
                  : (
                    <div className='w-full h-full flex items-center justify-center bg-gray-100 rounded-full text-gray-400'>
                      <FaUser size={36} />
                    </div>
                    )}
                <label htmlFor='imagen-perfil' className='absolute bottom-0 right-0 bg-gray-200 text-gray-700 p-1 rounded-full cursor-pointer hover:bg-gray-300'>
                  <FaCamera size={14} />
                  <input
                    ref={fileInputRef}
                    type='file'
                    id='imagen-perfil'
                    className='hidden'
                    accept='image/*'
                    onChange={handleImagenChange}
                  />
                </label>
              </div>
              <h3 className='text-lg font-medium text-center'>{perfil.nombre} {perfil.apellidos}</h3>
              <p className='text-gray-600 text-sm text-center mb-3'>{perfil.correo}</p>
              <div className='flex justify-center'>
                <span className='bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium'>
                  {usuario?.role || 'Usuario'}
                </span>
              </div>

              <div className='mt-4 flex justify-center'>
                <button
                  onClick={abrirSelectorImagen}
                  className='flex items-center justify-center px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50'
                >
                  <FaEdit className='mr-2' />
                  Editar foto de perfil
                </button>
              </div>
            </div>
          </div>

          {/* ACTIVIDAD dummy */}
          <div className='bg-white rounded-xl shadow overflow-hidden'>
            <div className='p-6'>
              <h3 className='text-lg font-medium mb-4 flex items-center'>
                <FaHistory className='text-gray-400 mr-2' />
                Actividad Reciente
              </h3>

              <div className='bg-gray-50 rounded-lg p-6 text-center'>
                <div className='flex justify-center mb-3'>
                  <div className='w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400'>
                    <FaHistory size={20} />
                  </div>
                </div>
                <p className='text-sm text-gray-500'>
                  La actividad reciente aparecerá aquí
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FORMULARIO */}
        <div className='lg:col-span-2'>
          <div className='bg-white rounded-xl shadow overflow-hidden'>
            <div className='p-6'>
              <h3 className='text-lg font-medium mb-4 flex items-center'>
                <FaUser className='text-gray-400 mr-2' />
                Información Personal
              </h3>

              {mensaje.texto && (
                <div className={`p-3 rounded-lg mb-4 ${mensaje.tipo === 'exito' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {mensaje.texto}
                </div>
              )}

              <form onSubmit={handleSubmit} className='space-y-4'>
                {/* ... todo tu formulario sin cambios ... */}
                {/* Nombre + Apellidos */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Nombre</label>
                    <input name='nombre' value={perfil.nombre} onChange={handleInputChange} className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500' required />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Apellidos</label>
                    <input name='apellidos' value={perfil.apellidos} onChange={handleInputChange} className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500' required />
                  </div>
                </div>

                {/* Correo */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Correo Electrónico</label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <FaEnvelope className='text-gray-400' />
                    </div>
                    <input name='correo' type='email' value={perfil.correo} onChange={handleInputChange}
                      className='w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-blue-500' required />
                  </div>
                </div>

                {/* Contraseñas (solo UI por ahora) */}
                <div className='pt-4 border-t border-gray-200'>
                  <h4 className='font-medium mb-3 flex items-center'><FaLock className='text-gray-400 mr-2' />Cambiar Contraseña</h4>
                  <div className='space-y-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>Contraseña Actual</label>
                      <input type='password' value={perfil.contrasenaActual} disabled
                        className='w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 cursor-not-allowed' />
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Nueva Contraseña</label>
                        <input name='contrasenaNueva' type='password' value={perfil.contrasenaNueva} onChange={handleInputChange}
                          className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500' />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Confirmar Contraseña</label>
                        <input name='confirmarContrasena' type='password' value={perfil.confirmarContrasena} onChange={handleInputChange}
                          className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500' />
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTONES */}
                <div className='flex justify-end mt-6 pt-4 border-t border-gray-200'>
                  <button type='button' onClick={() => navigate('/')} className='px-4 py-2 border border-gray-300 rounded-lg text-gray-700 mr-3 hover:bg-gray-50'>Cancelar</button>
                  <button type='submit' disabled={cargando}
                    className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center'>
                    {cargando
                      ? (<><svg className='animate-spin -ml-1 mr-2 h-4 w-4 text-white' viewBox='0 0 24 24'><circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle><path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path></svg>Guardando…</>)
                      : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
