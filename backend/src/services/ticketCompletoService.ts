import * as xlsx from 'xlsx';
import { promises as fs } from 'fs';
import Papa from 'papaparse';
import { generateSinStockCsv } from './sinStockService';

interface ExcelRow {
  codigo: string;
  cantidad: number;
  nombre: string;
  precio: number;
}

export const processTicketAndSinStock = async (
  excelPath: string,
  csvPath: string
): Promise<{ ticketCsv: string; sinStockCsv: string }> => {
  // 1. Leer Excel (igual que antes)
  const excelWorkbook = xlsx.readFile(excelPath);
  const excelSheet = excelWorkbook.Sheets[excelWorkbook.SheetNames[0]];
  const excelData = xlsx.utils.sheet_to_json(excelSheet, { header: 1 }) as any[][];

  const excelRows: ExcelRow[] = [];
  for (let i = 1; i < excelData.length; i++) {
    const row = excelData[i];
    if (!row[0]) continue;
    const codigo = row[0]?.toString().trim();
    const nombreCompleto = row[1]?.toString().trim() || '';
    const cantidadMatch = nombreCompleto.match(/^(\d+)\s*-\s*/);
    const cantidad = cantidadMatch ? parseInt(cantidadMatch[1], 10) : 1;
    const partes = nombreCompleto.split('-').map((s: string) => s.trim());
    const nombre = partes.length >= 3 ? partes.slice(2).join(' - ') : nombreCompleto;
    const precio = parseFloat(row[2]?.toString().replace(',', '.')) || 0;
    excelRows.push({ codigo, cantidad, nombre, precio });
  }

  // 2. Leer CSV
  const csvContent = await fs.readFile(csvPath, 'utf-8');
  const parsedCsv = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
  const csvRows = parsedCsv.data as any[];

  // 3. Procesar CSV: extraer código limpio y "Un. Caja"
  const csvMap = new Map<string, any>();
  for (const row of csvRows) {
    const codigoOriginal = row['Código producto'] || '';
    const match = codigoOriginal.match(/^(.+?)\s*-\s*Un\.\s*Caja:\s*(.+)$/i);
    if (!match) continue;
    const codigoLimpio = match[1].trim();
    const contenidoUnidad = `Un. Caja: ${match[2].trim()}`;
    if (!csvMap.has(codigoLimpio)) {
      const { K, L, M, N, ...resto } = row;
      csvMap.set(codigoLimpio, {
        ...resto,
        codigoLimpio,
        contenidoUnidad,
      });
    }
  }

  // 4. Generar CSV del ticket (productos válidos)
  const ticketRows: any[] = [];
  for (const excelRow of excelRows) {
    const csvRow = csvMap.get(excelRow.codigo);
    if (!csvRow) continue;
    const stock = parseFloat(csvRow['Stock disponible']);
    if (isNaN(stock) || stock <= 0) continue;

    ticketRows.push({
      'Almacén': csvRow['Almacén'] || '',
      'Código': csvRow.codigoLimpio || '',
      'Producto': csvRow['Producto'] || '',
      'Precio DDU': csvRow['Precio DDU'] || '',
      'Tarifa': csvRow['Tarifa'] || '',
      'Stock disponible': csvRow['Stock disponible'] || '',
      'Fecha Caducidad': csvRow['Fecha Caducidad'] || '',
      'Categoría producto': csvRow['Categoría producto'] || '',
      'Hueco': csvRow['Hueco'] || '',
      'Proveedor': csvRow['Proveedor'] || '',
      'Cantidad Pedida': excelRow.cantidad,
      'Precio Venta': excelRow.precio,
      'Cada Producto Contiene': csvRow.contenidoUnidad || '',
    });
  }

  // 5. Generar CSV de productos sin stock (usando la nueva función)
  const sinStockCsv = generateSinStockCsv(excelRows, csvMap);

  // 6. Retornar ambos CSV como strings
  return {
    ticketCsv: Papa.unparse(ticketRows),
    sinStockCsv,
  };
};