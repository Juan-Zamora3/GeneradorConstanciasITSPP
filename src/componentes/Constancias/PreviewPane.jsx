import React from "react";

export default function PreviewPane({
  urls = [],
  pdfSize,
  index,
  setIndex,
  onEditThis,
}) {
  if (!urls.length) return null;

  return (
    <div className="mx-auto">
      <div className="flex justify-center items-center gap-4 mb-2">
        <button
          disabled={index === 0}
          className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-40"
          onClick={() => setIndex((i) => i - 1)}
        >
          ← Anterior
        </button>
        <span className="text-sm">
          {index + 1}/{urls.length}
        </span>
        <button
          disabled={index === urls.length - 1}
          className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-40"
          onClick={() => setIndex((i) => i + 1)}
        >
          Siguiente →
        </button>
      </div>

      <iframe
        src={urls[index]}
        title="prev"
        className="w-full bg-gray-50"
        style={{ height: pdfSize.h }}
      />

      <div className="flex justify-center mt-3">
        <button
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded"
          onClick={onEditThis}
        >
          Editar esta constancia
        </button>
      </div>
    </div>
  );
}
