import Papa from 'papaparse';

interface ExcelRow {
  codigo: string;
  cantidad: number;
  nombre: string;
  precio: number;
}

/**
 * Genera un CSV con los productos del Excel que:
 * - No se encontraron en el CSV de stock, o
 * - Tienen stock disponible <= 0
 */
export const generateSinStockCsv = (
  excelRows: ExcelRow[],
  csvMap: Map<string, any>
): string => {
  const sinStock: any[] = [];

  for (const excelRow of excelRows) {
    const csvRow = csvMap.get(excelRow.codigo);

    if (!csvRow) {
      // Producto no encontrado en CSV
      sinStock.push({
        'Código': excelRow.codigo,
        'Producto': excelRow.nombre,
        'Motivo': 'No encontrado en CSV',
        'Cantidad Pedida': excelRow.cantidad,
        'Precio Venta': excelRow.precio,
      });
      continue;
    }

    const stock = parseFloat(csvRow['Stock disponible']);
    if (isNaN(stock) || stock <= 0) {
      // Producto con stock 0 o no numérico
      sinStock.push({
        'Código': excelRow.codigo,
        'Producto': excelRow.nombre,
        'Motivo': stock <= 0 ? 'Stock 0' : 'Stock no numérico',
        'Cantidad Pedida': excelRow.cantidad,
        'Precio Venta': excelRow.precio,
        'Stock CSV': csvRow['Stock disponible'] || '',
      });
    }
  }

  // Generar CSV
  return Papa.unparse(sinStock);
};