import React, { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

// Función segura para convertir ArrayBuffer a Base64
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export default function EnviarCorreo({
  participantes,
  plantillaPDF,
  mensajePersonalizado,
}) {
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);

 const generarPDF = async (p) => {
  const pdfDoc = await PDFDocument.load(plantillaPDF);
  pdfDoc.registerFontkit(fontkit);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();

  // Nombre centrado y subrayado igual que en Constancias.jsx
  const nombre = `${p.Nombres} ${p.ApellidoP} ${p.ApellidoM}`.toUpperCase();
  const sizeName = 24;
  const wName = fontBold.widthOfTextAtSize(nombre, sizeName);
  const nameX = (width - wName) / 2.6;
  const nameY = height / 2 + 50;

  page.drawText(nombre, {
    x: nameX,
    y: nameY,
    size: sizeName,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  // Dibuja la línea subrayada justo debajo del nombre
  page.drawLine({
    start: { x: nameX, y: nameY - 4 },
    end:   { x: nameX + wName, y: nameY - 4 },
    thickness: 1,
    color: rgb(0, 0, 0)
  });

  // Mensaje personalizado, centrado y con word-wrap
  if (mensajePersonalizado.trim()) {
    const fontSize = 12;
    const lineHeight = fontSize * 1.4;
    const maxWidth = width * 0.8;
    const palabras = mensajePersonalizado.trim().split(/\s+/);
    const lineas = [];
    let linea = "";

    for (const palabra of palabras) {
      const prueba = linea ? `${linea} ${palabra}` : palabra;
      if (fontReg.widthOfTextAtSize(prueba, fontSize) <= maxWidth) {
        linea = prueba;
      } else {
        lineas.push(linea);
        linea = palabra;
      }
    }
    if (linea) lineas.push(linea);

    let cursorY = nameY - sizeName - 12;
    for (const l of lineas) {
      const w = fontReg.widthOfTextAtSize(l, fontSize);
      const x = (width - w) / 3;
      page.drawText(l, {
        x,
        y: cursorY,
        size: fontSize,
        font: fontReg,
        color: rgb(0.2, 0.2, 0.2),
      });
      cursorY -= lineHeight;
    }
  }

  return pdfDoc.save();
};


  const handleSend = async () => {
    setSending(true);
    for (let i = 0; i < participantes.length; i++) {
      const p = participantes[i];
      if (!p.Correo) continue;

      console.log(`Enviando a: ${p.Correo}`); // DEBUG

      // Usa la función segura de conversión a Base64
      const pdfBytes = await generarPDF(p);
      const base64 = arrayBufferToBase64(pdfBytes);

     const res = await fetch("http://localhost:3000/EnviarCorreo", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    Correo: p.Correo,
    Nombres: `${p.Nombres} ${p.ApellidoP} ${p.ApellidoM}`,
    Puesto: p.Puesto,
    pdf: base64,
  }),
});


      if (!res.ok) {
        console.error("Error al enviar a", p.Correo, await res.text());
      }

      setProgress(Math.round(((i + 1) / participantes.length) * 100));
    }
    setSending(false);
    alert("Todos los correos fueron enviados correctamente.");
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <button
        onClick={handleSend}
        disabled={sending}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {sending ? `Enviando… ${progress}%` : "Enviar ahora"}
      </button>
    </div>
  );
}
