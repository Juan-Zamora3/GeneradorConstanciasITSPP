import React from "react";
import { FiLoader } from "react-icons/fi";
import { toast } from "react-toastify";

export default function ActionButtons({
  onPreview,
  onZip,
  onSend,
  loadingPreview,
  loadingZip,
  loadingSend,
  // validaciones
  mode,                   // 'individual' | 'equipos'
  selectedEmailCount,     // número de emails detectados en la selección actual
}) {
  const guardSend = () => {
    if (!selectedEmailCount || selectedEmailCount < 1) {
      toast.warning(
        mode === "equipos"
          ? "Selecciona al menos un equipo con correo para enviar constancias."
          : "No hay correos en los participantes seleccionados."
      );
      return;
    }
    onSend?.();
  };

  return (
    <div className="space-y-2">
      <button
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded flex justify-center items-center"
        onClick={onPreview}
        disabled={loadingPreview}
      >
        {loadingPreview && <FiLoader className="animate-spin mr-2" />}
        Generar constancias
      </button>

      <button
        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded flex justify-center items-center"
        onClick={onZip}
        disabled={loadingZip}
      >
        {loadingZip && <FiLoader className="animate-spin mr-2" />}
        Descargar ZIP
      </button>

      <button
        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded flex justify-center items-center"
        onClick={guardSend}
        disabled={loadingSend}
      >
        {loadingSend && <FiLoader className="animate-spin mr-2" />}
        Enviar por correo
      </button>
    </div>
  );
}
