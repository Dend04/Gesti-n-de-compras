import * as xlsx from 'xlsx';
import { promises as fs } from 'fs';
import Papa from 'papaparse';

interface ExcelRow {
  codigo: string;
  cantidad: number;
  nombre: string;
  precio: number;
}

export const processTicket = async (excelPath: string, csvPath: string): Promise<string> => {
  // 1. Leer Excel
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

  // 4. Combinar, incluyendo productos sin correspondencia
  const resultado: any[] = [];

  for (const excelRow of excelRows) {
    const csvRow = csvMap.get(excelRow.codigo);

    if (csvRow) {
      // Producto encontrado en CSV
      resultado.push({
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
    } else {
      // Producto NO encontrado en CSV: se usan datos del Excel y "no disponible"
      resultado.push({
        'Almacén': 'no disponible',
        'Código': excelRow.codigo,
        'Producto': excelRow.nombre,
        'Precio DDU': 'no disponible',
        'Tarifa': 'no disponible',
        'Stock disponible': 'no disponible',
        'Fecha Caducidad': 'no disponible',
        'Categoría producto': 'no disponible',
        'Hueco': 'no disponible',
        'Proveedor': 'no disponible',
        'Cantidad Pedida': excelRow.cantidad,
        'Precio Venta': excelRow.precio,
        'Cada Producto Contiene': 'no disponible',
      });
    }
  }

  // 5. Generar CSV de salida
  const outputPath = excelPath.replace(/\.xlsx?$/, '') + '_ticket.csv';
  const outputCsv = Papa.unparse(resultado);
  await fs.writeFile(outputPath, outputCsv, 'utf-8');
  return outputPath;
};