import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import { Buffer } from 'buffer';

export const generateSinStockExcel = async (csvContent: string, filename: string): Promise<Buffer> => {
  // Parsear CSV (viene de sinStockService)
  const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
  const productos = parsed.data as any[];
  const headers = parsed.meta.fields || [];

  // Crear libro de Excel
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sin Stock');

  // Configurar fuente global
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.font = { name: 'Aptos Narrow', size: 11 };
    });
  });

  // Título en A1: "Productos sin stock - [fecha actual]"
  const fecha = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  sheet.mergeCells('A1:E1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = `Productos sin stock - ${fecha}`;
  titleCell.font = { name: 'Aptos Narrow', size: 14, bold: true };
  titleCell.alignment = { horizontal: 'center' };

  // Fila 2: Encabezados
  const headerRow = sheet.addRow([
    'Código',
    'Producto',
    'Existe en BD',
    'Stock',
    'Motivo'
  ]);
  headerRow.font = { name: 'Aptos Narrow', size: 11, bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Datos desde fila 3
  for (const prod of productos) {
    const existe = prod['Motivo']?.includes('No encontrado') ? 'No' : 'Sí';
    const stock = prod['Stock CSV'] || (existe === 'Sí' ? '0' : '');
    const motivo = prod['Motivo'] || '';

    const row = sheet.addRow([
      prod['Código'] || '',
      prod['Producto'] || '',
      existe,
      stock,
      motivo
    ]);

    // Aplicar fuente
    row.eachCell((cell) => {
      cell.font = { name: 'Aptos Narrow', size: 11 };
    });

    // Color rojo para toda la fila
    row.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFC0C0' } // Rojo claro
      };
    });
  }

  // Ajustar ancho de columnas
  sheet.getColumn(1).width = 18; // Código
  sheet.getColumn(2).width = 60; // Producto
  sheet.getColumn(3).width = 15; // Existe en BD
  sheet.getColumn(4).width = 12; // Stock
  sheet.getColumn(5).width = 30; // Motivo

  // Congelar encabezados (fila 2)
  sheet.views = [
    { state: 'frozen', ySplit: 2, topLeftCell: 'A3', activeCell: 'A3' }
  ];

  // Generar buffer
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer as ArrayBuffer);
};