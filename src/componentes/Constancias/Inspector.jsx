import React from "react";

export default function Inspector({
  activeBoxId,
  box,
  onPatch,          // (partial) => void
  fontOptions = [],
  onClose,
}) {
  if (!activeBoxId || !box) return null;

  return (
    <aside className="fixed top-0 right-0 w-72 h-full bg-white border-l shadow-lg p-4 overflow-auto z-20">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold">Propiedades “{activeBoxId}”</h4>
        <button
          className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>

      <label className="block text-xs">Tamaño</label>
      <input
        type="number"
        min={6}
        max={72}
        value={box.size}
        onChange={(e) => onPatch({ size: +e.target.value })}
        className="w-full p-1 border rounded text-sm"
      />

      <label className="block text-xs mt-2">Color</label>
      <input
        type="color"
        value={box.color}
        onChange={(e) => onPatch({ color: e.target.value })}
        className="w-full h-9 p-0"
      />

      <label className="block text-xs mt-2">Fuente</label>
      <select
        value={box.font}
        onChange={(e) => onPatch({ font: e.target.value })}
        className="w-full p-1 border rounded text-sm"
      >
        {fontOptions.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>

      <label className="block text-xs mt-2">Alineado</label>
      <select
        value={box.align}
        onChange={(e) => onPatch({ align: e.target.value })}
        className="w-full p-1 border rounded text-sm"
      >
        {["left", "center", "right", "justify"].map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      <label className="inline-flex items-center mt-2 text-sm">
        <input
          type="checkbox"
          checked={box.bold}
          onChange={(e) => onPatch({ bold: e.target.checked })}
        />
        <span className="ml-2">Negritas</span>
      </label>

      <label className="block text-xs mt-3">Interlineado (1.0–2.0)</label>
      <input
        type="number"
        step="0.05"
        min="0.9"
        max="3"
        value={box.lineHeight ?? 1.0}
        onChange={(e) => onPatch({ lineHeight: +e.target.value })}
        className="w-full p-1 border rounded text-sm"
      />

      <label className="block text-xs mt-3">Espacio entre letras (px)</label>
      <input
        type="number"
        step="0.5"
        min="0"
        max="20"
        value={box.letterSpacing ?? 0}
        onChange={(e) => onPatch({ letterSpacing: +e.target.value })}
        className="w-full p-1 border rounded text-sm"
      />

      <label className="block text-xs mt-3">Rotación (°)</label>
      <input
        type="number"
        step="1"
        min="-30"
        max="30"
        value={box.rotate ?? 0}
        onChange={(e) => onPatch({ rotate: +e.target.value })}
        className="w-full p-1 border rounded text-sm"
      />

      <label className="block text-xs mt-3">Opacidad (0–1)</label>
      <input
        type="number"
        step="0.05"
        min="0.1"
        max="1"
        value={box.opacity ?? 1}
        onChange={(e) => onPatch({ opacity: +e.target.value })}
        className="w-full p-1 border rounded text-sm"
      />

      <label className="block text-xs mt-3">Transformación</label>
      <select
        value={box.transform || "none"}
        onChange={(e) => onPatch({ transform: e.target.value })}
        className="w-full p-1 border rounded text-sm"
      >
        <option value="none">ninguna</option>
        <option value="uppercase">MAYÚSCULAS</option>
        <option value="capitalize">Capitalizar</option>
      </select>
    </aside>
  );
}
