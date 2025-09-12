import React from "react";

export default function TemplateUploader({ plantilla, onPick }) {
  const inputRef = React.useRef(null);

  return (
    <section>
      <h4 className="font-semibold mb-2">Plantilla PDF</h4>

      <button
        type="button"
        className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow transition"
        onClick={() => inputRef.current?.click()}
      >
        {plantilla ? "Cambiar plantilla" : "Subir plantilla"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          onPick(await f.arrayBuffer(), f.name);
        }}
      />

      {plantilla && (
        <p className="mt-2 text-xs text-gray-500 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500" /> PDF
          cargado
        </p>
      )}
    </section>
  );
}
