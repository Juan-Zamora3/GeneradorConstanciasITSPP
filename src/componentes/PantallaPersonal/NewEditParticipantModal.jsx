import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

const emailRegex = /^\S+@\S+\.\S+$/
const phoneRegex = /^[0-9]{10,15}$/

export default function NewEditParticipantModal({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) {
  const [form, setForm] = useState({
    nombre: '',
    apellidos: '',
    correo: '',
    area: '',
    telefono: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (initialData) setForm(initialData)
    else
      setForm({
        nombre: '',
        apellidos: '',
        correo: '',
        area: '',
        telefono: ''
      })
    setErrors({})
  }, [initialData, isOpen])

  const validate = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'Nombre obligatorio'
    if (!form.apellidos.trim()) e.apellidos = 'Apellidos obligatorios'
    if (!emailRegex.test(form.correo)) e.correo = 'Correo inválido'
    if (!form.area.trim()) e.area = 'Área/Puesto obligatorio'
    if (form.telefono && !phoneRegex.test(form.telefono))
      e.telefono = 'Teléfono inválido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrors(f => ({ ...f, [e.target.name]: null }))
  }

  const submit = e => {
    e.preventDefault()
    if (!validate()) return
    onSubmit(form)
  }

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full overflow-auto max-h-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">
              {initialData ? 'Editar' : 'Registrar'} Participante
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>
          <form onSubmit={submit} className="space-y-4">
            {[
              { name: 'nombre', label: 'Nombre', type: 'text' },
              { name: 'apellidos', label: 'Apellidos', type: 'text' },
              { name: 'correo', label: 'Correo electrónico', type: 'email' },
              { name: 'area', label: 'Área/Puesto', type: 'text' },
              {
                name: 'telefono',
                label: 'Teléfono (opcional)',
                type: 'tel'
              }
            ].map(f => (
              <div key={f.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {f.label}
                </label>
                <input
                  name={f.name}
                  type={f.type}
                  value={form[f.name]}
                  onChange={handleChange}
                  className={`w-full border ${
                    errors[f.name] ? 'border-red-500' : 'border-gray-300'
                  } rounded-md px-3 py-2 focus:outline-none ${
                    errors[f.name] ? 'focus:ring-red-500' : 'focus:ring-blue-500'
                  }`}
                  placeholder={`Ingresa ${f.label.toLowerCase()}`}
                />
                {errors[f.name] && (
                  <p className="text-red-600 text-sm mt-1">{errors[f.name]}</p>
                )}
              </div>
            ))}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                <i className="ri-save-line mr-2"></i>
                {initialData ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

NewEditParticipantModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialData: PropTypes.object
}
