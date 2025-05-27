import React from 'react'
import PropTypes from 'prop-types'

export default function DetailsParticipantModal({
  isOpen,
  participant,
  onClose
}) {
  if (!isOpen || !participant) return null

  const initials = (n, a) =>
    n.charAt(0) + (a ? a.charAt(0) : '')
  const color = id => {
    const cols = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-yellow-100 text-yellow-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800'
    ]
    const sum = [...id].reduce((s, c) => s + c.charCodeAt(0), 0)
    return cols[sum % cols.length]
  }

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full overflow-auto max-h-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Detalles del Participante</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>
          <div className="flex items-center mb-6">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg ${color(participant.id)}`}
            >
              {initials(participant.nombre, participant.apellidos)}
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-semibold">
                {participant.nombre} {participant.apellidos}
              </h4>
              <p className="text-gray-600">{participant.area}</p>
            </div>
          </div>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <strong>Correo:</strong> {participant.correo}
            </div>
            {participant.telefono && (
              <div>
                <strong>Teléfono:</strong> {participant.telefono}
              </div>
            )}
            <div>
              <strong>Área/Puesto:</strong> {participant.area}
            </div>
          </div>
          <div className="flex justify-end pt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

DetailsParticipantModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  participant: PropTypes.object,
  onClose: PropTypes.func.isRequired
}
