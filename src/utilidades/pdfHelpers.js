// src/utilidades/pdfHelpers.js
import { StandardFonts, rgb, degrees } from 'pdf-lib';

/* -------------------------------------------
   Tamaños por defecto (puntos). Se sobrescriben
   al leer la plantilla real, pero sirven de base.
-------------------------------------------- */
export const PDF_W = 595.28; // A4 ancho
export const PDF_H = 841.89; // A4 alto

/* -------------------------------------------
   Fuentes disponibles (todas estándar PDF)
-------------------------------------------- */
export const FONT_OPTIONS = [
  'Helvetica',
  'Helvetica-Bold',
  'Helvetica-Oblique',
  'Helvetica-BoldOblique',
  'Times-Roman',
  'Times-Bold',
  'Times-Italic',
  'Times-BoldItalic',
  'Courier',
  'Courier-Bold',
  'Courier-Oblique',
  'Courier-BoldOblique',
];

// Mapeo a StandardFonts
export const FONT_LOOKUP = {
  'Helvetica': StandardFonts.Helvetica,
  'Helvetica-Bold': StandardFonts.HelveticaBold,
  'Helvetica-Oblique': StandardFonts.HelveticaOblique,
  'Helvetica-BoldOblique': StandardFonts.HelveticaBoldOblique,
  'Times-Roman': StandardFonts.TimesRoman,
  'Times-Bold': StandardFonts.TimesBold,
  'Times-Italic': StandardFonts.TimesItalic,
  'Times-BoldItalic': StandardFonts.TimesBoldItalic,
  'Courier': StandardFonts.Courier,
  'Courier-Bold': StandardFonts.CourierBold,
  'Courier-Oblique': StandardFonts.CourierOblique,
  'Courier-BoldOblique': StandardFonts.CourierBoldOblique,
};

/* -------------------------------------------
   Colores
-------------------------------------------- */
export const toRGB = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#000000');
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  return rgb(r, g, b);
};

/* -------------------------------------------
   Fechas
-------------------------------------------- */
export function fechaLarga(dateLike) {
  if (!dateLike) return '';
  const d = new Date(dateLike);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).toUpperCase(); // mantiene estilo usado en constancias
}

/* -------------------------------------------
   ArrayBuffer -> Base64 (para adjuntos correo)
-------------------------------------------- */
export function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // procesa en bloques para evitar call stack gigante
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunkSize)
    );
  }
  return btoa(binary);
}

/* -------------------------------------------
   Wrap de texto con tracking simple
-------------------------------------------- */
export function wrapTextAdvanced(text, font, size, maxWidth, letterSpacing = 0) {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let current = '';

  const width = (s) =>
    font.widthOfTextAtSize(s, size) + (s.length ? (s.length - 1) * letterSpacing : 0);

  for (const w of words) {
    const attempt = current ? current + ' ' + w : w;
    if (width(attempt) <= maxWidth) {
      current = attempt;
    } else {
      if (current) lines.push(current);
      // si una palabra sola es más grande, la troceamos
      if (width(w) > maxWidth) {
        let chunk = '';
        for (const ch of w) {
          const tryChunk = chunk + ch;
          if (width(tryChunk) <= maxWidth) chunk = tryChunk;
          else {
            lines.push(chunk);
            chunk = ch;
          }
        }
        current = chunk;
      } else {
        current = w;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

// Alias compatible con tu import en Constancias.jsx
export function wrapText(text, font, size, maxWidth) {
  return wrapTextAdvanced(text, font, size, maxWidth, 0);
}

/* -------------------------------------------
   Dibujo de caja de texto avanzada
   - letterSpacing
   - lineHeight
   - rotate
   - transform: 'none' | 'uppercase' | 'capitalize'
-------------------------------------------- */
export function drawTextBox(page, {
  text, x, y, w, align = 'left', font, size, color,
  bold, lineHeight = 1.0, letterSpacing = 0, opacity = 1, rotate = 0, transform = 'none',
}) {
  let t = String(text || '');
  if (transform === 'uppercase') t = t.toUpperCase();
  if (transform === 'capitalize') t = t.replace(/\b\w/g, m => m.toUpperCase());

  const lines = wrapTextAdvanced(t, font, size, w, letterSpacing);
  let yy = page.getHeight() - y - size;

  lines.forEach((line) => {
    const baseWidth = font.widthOfTextAtSize(line, size);
    const track = (line.length ? (line.length - 1) * letterSpacing : 0);
    const totalW = baseWidth + track;

    let xx = x;
    if (align === 'center') xx += (w - totalW) / 2;
    else if (align === 'right') xx += w - totalW;

    page.pushOperators(); // aislar transformaciones
    if (rotate) page.rotate(degrees(rotate), { x: xx, y: yy });
    page.drawText(line, { x: xx, y: yy, size, font, color, opacity });
    page.popOperators();

    yy -= size * (lineHeight || 1.0);
  });
}
