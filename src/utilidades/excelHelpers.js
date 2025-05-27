// convierte lista de objetos a un workbook de SheetJS
import * as XLSX from 'xlsx';

export function listToWorkbook(list) {
  const sheet = XLSX.utils.json_to_sheet(list);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Participantes');
  return wb;
}

// convierte un File/ArrayBuffer a arreglo de objetos
export async function fileToList(file) {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet); // [{nombre,apellidos,correo,...}]
}
