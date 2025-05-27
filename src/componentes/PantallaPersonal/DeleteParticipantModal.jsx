import React from 'react'
import PropTypes from 'prop-types'

export default function DeleteParticipantModal({
  isOpen,
  participant,
  onCancel,
  onConfirm
}) {
  if (!isOpen || !participant) return null
  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-red-600">
              Confirmar Eliminación
            </h3>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>
          <p>
            ¿Seguro que deseas eliminar a{' '}
            <strong>
              {participant.nombre} {participant.apellidos}
            </strong>
            ?
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              <i className="ri-delete-bin-line mr-2"></i>Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

DeleteParticipantModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  participant: PropTypes.object,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired
}
