import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import { Buffer } from 'buffer';

export const generateFormattedExcel = async (csvContent: string, filename: string): Promise<Buffer> => {
  // Parsear CSV
  const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
  const data = parsed.data as any[];
  const headers = parsed.meta.fields || [];

  // Crear libro de Excel
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Ticket');

  // Agregar encabezados
  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Identificar nombres de columnas por posición (1-indexado: A=1, B=2, ...)
  const getColName = (index: number) => (index < headers.length ? headers[index] : null);
  const colD = getColName(3);  // Columna D (índice 3)
  const colF = getColName(5);  // Columna F (índice 5)
  const colG = getColName(6);  // Columna G (índice 6)
  const colK = getColName(10); // Columna K (índice 10)
  const colL = getColName(11); // Columna L (índice 11)

  // Función para convertir fecha a serial de Excel y aplicar formato
  const parseDate = (dateStr: string): { value: number | string, format?: string } => {
    if (!dateStr) return { value: '' };
    // Intentar varios formatos comunes
    // dd/mm/yyyy o dd-mm-yyyy
    let parts: number[] = [];
    if (dateStr.includes('/')) {
      parts = dateStr.split('/').map(Number);
    } else if (dateStr.includes('-')) {
      parts = dateStr.split('-').map(Number);
    }
    if (parts.length === 3) {
      const [day, month, year] = parts;
      // Nota: Mes en JavaScript es 0-indexado, así que month-1
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        // Excel serial: días desde 1900-01-01
        const excelSerial = 25569 + Math.floor((date.getTime() / 86400000));
        return { value: excelSerial, format: 'dd/mm/yyyy' };
      }
    }
    // Si no se puede parsear, devolver el string original
    return { value: dateStr };
  };

  // Agregar datos con tipos adecuados
  data.forEach((row) => {
    const rowValues = headers.map((header) => {
      const value = row[header] || '';

      // Columnas numéricas (D, F, K, L)
      if (header === colD || header === colF || header === colK || header === colL) {
        const num = parseFloat(value);
        return isNaN(num) ? value : num;
      }
      // Columna de fecha (G)
      else if (header === colG) {
        const parsed = parseDate(value);
        return parsed.value; // Puede ser número o string
      }
      // Otras columnas como string
      return value;
    });

    const newRow = sheet.addRow(rowValues);

    // Aplicar formato de fecha a la columna G
    if (colG) {
      const cell = newRow.getCell(headers.indexOf(colG) + 1);
      if (typeof cell.value === 'number') {
        cell.numFmt = 'dd/mm/yyyy';
      }
    }

    // Aplicar color rojo si "Stock disponible" es 0
    const stock = row['Stock disponible'];
    if (stock !== undefined && parseFloat(stock) === 0) {
      newRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC0C0' } // Rojo claro
        };
      });
    }
  });

  // Ajustar ancho de columnas automáticamente
  sheet.columns.forEach(column => {
    let maxLength = 0;
    if (column.values) {
      column.values.forEach((val: any) => {
        if (val) {
          const length = val.toString().length;
          if (length > maxLength) maxLength = length;
        }
      });
    }
    column.width = Math.min(maxLength + 2, 50);
  });

  // Generar buffer
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer as ArrayBuffer);
};