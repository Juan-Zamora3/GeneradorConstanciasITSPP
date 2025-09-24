// src/pages/Login.jsx
import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../servicios/firebaseConfig'
import { AuthContext } from '../contexto/AuthContext'

import FondoAPP    from '../assets/FondoAPP.png'
import FondoMorado from '../assets/Fondomorado.png'
import logo        from '../assets/logo.png'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useContext(AuthContext)

  const [isRegister, setIsRegister] = useState(false)
  const [name, setName]             = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [alertMsg, setAlertMsg]     = useState('')
  const [errorMsg, setErrorMsg]     = useState('')

  const resetMessages = () => {
    setAlertMsg('')
    setErrorMsg('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setAlertMsg('Por favor completa todos los campos.')
      return
    }
    resetMessages()

    try {
      // Verificar si es la cuenta de cajero
      if (email === 'admin@cajero.com' && password === 'cajero123') {
        const userData = {
          name: 'Administrador Cajero',
          email: email,
          role: 'cajero'
        }
        login(userData)
        navigate('/pantalla-cajero', { replace: true })
        return
      }

      const snap = await getDoc(doc(db, 'Usuarios', email))
      if (!snap.exists() || snap.data().password !== password) {
        setErrorMsg('Credenciales incorrectas.')
        return
      }

      const data = snap.data()
      // Si role no está definido o es distinto de 'user', lo tratamos como 'admin'
      const role = data.role === 'user' ? 'user' : 'admin'

      const userData = {
        name:  data.name || data.nombre || 'Usuario',
        email,
        role
      }

      // Guardamos en el contexto y localStorage
      login(userData)
      navigate('/inicio', { replace: true })
    } catch {
      setErrorMsg('Error al acceder a los datos del usuario.')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!name || !email || !password) {
      setAlertMsg('Por favor completa todos los campos.')
      return
    }
    resetMessages()

    try {
      const ref = doc(db, 'Usuarios', email)
      const existing = await getDoc(ref)
      if (existing.exists()) {
        setErrorMsg('El correo ya está registrado.')
        return
      }
      // Registro siempre como 'user'
      await setDoc(ref, { name, password, role: 'user' })
      login({ name, email, role: 'user' })
      navigate('/inicio', { replace: true })
    } catch {
      setErrorMsg('Error al registrar el usuario.')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${FondoAPP})` }}
    >
      <div className="bg-white max-w-3xl w-full mx-4 mt-16 mb-16 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Formulario */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-8 uppercase text-center">
            {isRegister ? 'REGISTRO' : 'INICIO DE SESIÓN'}
          </h2>

          {alertMsg && (
            <div className="bg-yellow-50 text-yellow-800 px-4 py-2 mb-6 rounded">
              {alertMsg}
            </div>
          )}
          {errorMsg && (
            <div className="bg-red-50 text-red-800 px-4 py-2 mb-6 rounded">
              {errorMsg}
            </div>
          )}

          <form
            onSubmit={isRegister ? handleRegister : handleLogin}
            className="space-y-6"
          >
            {isRegister && (
              <div>
                <label htmlFor="name" className="block text-sm text-gray-600 mb-1">
                  Nombre completo
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="w-full border-b-2 border-gray-300 focus:border-blue-600 outline-none py-2"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm text-gray-600 mb-1">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="usuario@puertopenasco.tecnm.mx"
                className="w-full border-b-2 border-gray-300 focus:border-blue-600 outline-none py-2"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-gray-600 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border-b-2 border-gray-300 focus:border-blue-600 outline-none py-2"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              {isRegister ? 'Registrarse' : 'Login'}
            </button>
          </form>


        </div>

        {/* Imagen lateral */}
        <div className="hidden md:block md:w-1/2 relative">
          <img
            src={FondoMorado}
            alt="Campus ITSPP"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-purple-800 bg-opacity-60 flex items-center justify-center">
            <img src={logo} alt="Logo ITSPP" className="h-28" />
          </div>
        </div>
      </div>
    </div>
  )
}
