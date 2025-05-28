// src/componentes/PantallaCursos/QrCanvas.jsx
import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export default function QrCanvas({ courseId, size = 240 }) {
  // 1) URL que abrirá el formulario
  const url = `${window.location.origin}/asistencia/${courseId}`;

  // 2) Ref al elemento <canvas>
  const canvasRef = useRef(null);

  // 3) Manejar descarga
  const downloadQR = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return alert('No se generó el QR');

    const pngUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = `QR_Curso_${courseId}.png`;
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Canvas del QR */}
      <div ref={canvasRef}>
        <QRCodeCanvas value={url} size={size} includeMargin />
      </div>

      {/* Botón de descarga */}
      <button
        onClick={downloadQR}
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Descargar QR
      </button>
    </div>
  );
}
