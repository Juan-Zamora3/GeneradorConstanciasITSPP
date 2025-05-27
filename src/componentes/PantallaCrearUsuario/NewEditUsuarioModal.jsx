import React, { useState, useEffect } from 'react'

export default function NewEditUsuarioModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm]       = useState({ nombre:'', correo:'', password:'' })
  const [errors, setErrors]   = useState({})

  const emailRegex = /^\S+@\S+\.\S+$/

  useEffect(() => {
    // resetear al abrir/cerrar
    if (isOpen) setForm({ nombre:'', correo:'', password:'' })
    setErrors({})
  }, [isOpen])

  const validate = () => {
    const e = {}
    if (!form.nombre.trim())        e.nombre   = 'Requerido'
    if (!emailRegex.test(form.correo)) e.correo = 'Inválido'
    if (form.password.length < 6)    e.password = '6+ chars'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChange = e =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = e => {
    e.preventDefault()
    if (!validate()) return
    onSubmit(form)
  }

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4">
      {/* Fondo borroso */}
      <div className="absolute inset-0 backdrop-blur-sm"></div>
      <div className="relative bg-white rounded-lg max-w-sm w-full p-6 space-y-4 z-10">
        <h3 className="text-xl font-semibold">Nuevo Usuario</h3>
        <form onSubmit={submit} className="space-y-3">
          {[
            { name:'nombre',   label:'Nombre completo', type:'text'     },
            { name:'correo',   label:'Correo',          type:'email'    },
            { name:'password', label:'Contraseña',      type:'password' }
          ].map(f => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700">
                {f.label}
              </label>
              <input
                name={f.name}
                type={f.type}
                value={form[f.name]}
                onChange={handleChange}
                className={`w-full border ${
                  errors[f.name] ? 'border-red-500' : 'border-gray-300'
                } rounded px-2 py-1 focus:outline-none`}
              />
              {errors[f.name] && (
                <p className="text-red-600 text-xs mt-1">{errors[f.name]}</p>
              )}
            </div>
          ))}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
