import React from 'react'
import { ChromePicker } from 'react-color'

export default function Inspector({ cfg, onUpdate, onClose }) {
  if (!cfg) return null
  return (
    <div
      className="absolute top-2 left-1/2 -translate-x-1/2 z-50
                 bg-white shadow px-4 py-2 rounded flex items-center gap-3"
    >
      <label className="text-sm flex items-center gap-1">
        Tamaño
        <input
          type="number"
          value={cfg.size}
          min={8}
          max={72}
          onChange={e => onUpdate({ size: +e.target.value })}
          className="w-14 border rounded px-1"
        />
      </label>

      <button
        onClick={() => onUpdate({ bold: !cfg.bold })}
        className={`px-2 py-1 border rounded ${
          cfg.bold ? 'bg-gray-200' : ''
        }`}
      >
        B
      </button>

      <select
        value={cfg.align}
        onChange={e => onUpdate({ align: e.target.value })}
        className="border rounded px-1"
      >
        <option value="left">←</option>
        <option value="center">↔︎</option>
        <option value="right">→</option>
      </select>

      <ChromePicker
        color={cfg.color}
        onChangeComplete={c => onUpdate({ color: c.hex })}
        disableAlpha
      />

      <button onClick={onClose} className="ml-2 text-red-500">
        X
      </button>
    </div>
  )
}
