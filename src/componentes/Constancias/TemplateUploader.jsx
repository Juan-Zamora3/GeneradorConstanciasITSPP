import React, { useRef } from 'react'

export default function TemplateUploader({ plantillaBuf, onUpload }) {
  const fileRef = useRef()

  return (
    <div>
      <h3 className="text-lg font-semibold">Plantilla PDF</h3>
      <button
        onClick={() => fileRef.current.click()}
        className="mt-2 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {plantillaBuf ? 'Cambiar plantilla' : 'Subir plantilla'}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={onUpload}
      />
      {plantillaBuf && (
        <p className="mt-1 text-sm text-green-700">✔ Plantilla cargada</p>
      )}
    </div>
  )
}
