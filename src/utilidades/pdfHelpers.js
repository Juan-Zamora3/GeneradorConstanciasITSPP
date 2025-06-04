// src/utilidades/pdfHelpers.js
import tiny from 'tinycolor2';
import { rgb } from 'pdf-lib';

export function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export const PDF_W = 595;
export const PDF_H = 842;

export const FONT_LOOKUP = {
  Helvetica: 'Helvetica',
  'Helvetica-Bold': 'Helvetica-Bold',
  TimesRoman: 'Times-Roman',
  'Times-Bold': 'Times-Bold',
  Courier: 'Courier'
};

export const FONT_OPTIONS = Object.keys(FONT_LOOKUP);

export function toRGB(hex) {
  const c = tiny(hex).toRgb();
  return rgb(c.r / 255, c.g / 255, c.b / 255);
}

export function fechaLarga(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const M = [
    'ENERO',
    'FEBRERO',
    'MARZO',
    'ABRIL',
    'MAYO',
    'JUNIO',
    'JULIO',
    'AGOSTO',
    'SEPTIEMBRE',
    'OCTUBRE',
    'NOVIEMBRE',
    'DICIEMBRE'
  ];
  return `${d.getDate()} de ${M[d.getMonth()]} de ${d.getFullYear()}`;
}

export function wrapText(text, font, size, maxW) {
  const out = [];
  text.split('\n').forEach(line => {
    let current = '';
    line.split(' ').forEach(word => {
      const probe = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(probe, size) > maxW && current) {
        out.push(current);
        current = word;
      } else {
        current = probe;
      }
    });
    out.push(current);
  });
  return out;
}
