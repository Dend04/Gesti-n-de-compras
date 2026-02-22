import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import { Buffer } from 'buffer';

export const generateFormattedExcel = async (csvContent: string, filename: string): Promise<Buffer> => {
  // Parsear CSV
  const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
  const productos = parsed.data as any[];
  const headers = parsed.meta.fields || [];

  // Crear libro de Excel
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Pedido');

  // ============================================
  // Configurar fuente global de la hoja (Aptos Narrow 11)
  // ============================================
  // Se aplicará a cada celda al crearlas, pero podemos definir un estilo por defecto para la hoja
  // ExcelJS no tiene un "estilo de hoja" global, así que lo aplicaremos en cada celda relevante.

  // ============================================
  // 1. Cabecera del pedido (filas 1 a 10)
  // ============================================
  // Fila 1: vacía
  let row = sheet.addRow([]);
  row.eachCell((cell) => { cell.font = { name: 'Aptos Narrow', size: 11 }; });

  // Fila 2: (dejamos C2 vacío)
  row = sheet.addRow(['', 'Codigo Cliente', '', 'Cliente', 'Mercal SRL', '', '', '']);
  row.eachCell((cell) => { cell.font = { name: 'Aptos Narrow', size: 11 }; });

  // Fila 3: (dejamos C3 vacío)
  row = sheet.addRow(['', 'Agente Comercial', '', '', '', '', '', '']);
  row.eachCell((cell) => { cell.font = { name: 'Aptos Narrow', size: 11 }; });

  // Fila 4: vacía
  row = sheet.addRow([]);
  row.eachCell((cell) => { cell.font = { name: 'Aptos Narrow', size: 11 }; });

  // Fila 5: Dirección cliente (vacía)
  row = sheet.addRow(['', 'Direccion cliente', '', '', '', '', '', '']);
  row.eachCell((cell) => { cell.font = { name: 'Aptos Narrow', size: 11 }; });

  // Filas 6-8: vacías
  for (let i = 0; i < 3; i++) {
    row = sheet.addRow([]);
    row.eachCell((cell) => { cell.font = { name: 'Aptos Narrow', size: 11 }; });
  }

  // Fila 9: Importe Total (vacío)
  row = sheet.addRow(['', 'Importe Total', '', '', '', '', '', '']);
  row.eachCell((cell) => { cell.font = { name: 'Aptos Narrow', size: 11 }; });

  // Fila 10: vacía
  row = sheet.addRow([]);
  row.eachCell((cell) => { cell.font = { name: 'Aptos Narrow', size: 11 }; });

  // ============================================
  // 2. Encabezados de la tabla (fila 11)
  // ============================================
  const headerRow = sheet.addRow([
    '',
    'Codigo',
    'Producto',
    'Precio venta LHC(Zona Oriental)',
    'Un Palet',
    'Un Caja',
    'Cantidad de pedido',
    'Importe linea'
  ]);
  // Aplicar fuente y estilo
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Aptos Narrow', size: 11, bold: true };
  });
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  // Negrita adicional en la celda D11 (opcional, ya está en negrita)
  headerRow.getCell(4).font = { name: 'Aptos Narrow', size: 11, bold: true };

  // ============================================
  // 3. Datos de productos (desde fila 12)
  // ============================================
  const startRow = 12; // La primera fila de datos será la 12

  productos.forEach((prod, index) => {
    const codigo = prod['Código'] || '';
    const nombre = prod['Producto'] || '';
    const precio = parseFloat(prod['Precio Venta']) || 0;
    const cantidad = parseFloat(prod['Cantidad Pedida']) || 0;
    const stock = parseFloat(prod['Stock disponible']); // para formato rojo

    // Crear fila con los datos
    const newRow = sheet.addRow([
      '',                // Columna A vacía
      codigo,            // B (código)
      nombre,            // C (producto)
      precio,            // D (precio)
      '',                // E (Un Palet vacío)
      cantidad,          // F (Un Caja) - entero
      '',                // G (Cantidad de pedido vacía)
      ''                 // H (Importe línea vacío)
    ]);

    // Aplicar fuente Aptos Narrow 11
    newRow.eachCell((cell) => {
      cell.font = { name: 'Aptos Narrow', size: 11 };
    });

    // Aplicar color verde claro a la celda de la columna B (código) - solo datos, no encabezados
    const cellB = newRow.getCell(2);
    cellB.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFC1F0C8' } // Verde claro (#C1F0C8)
    };

    // Aplicar color rojo a toda la fila si el stock es 0
    if (stock === 0) {
      newRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC0C0' } // Rojo claro
        };
      });
      // Restaurar el verde de la columna B (para que no se pierda)
      cellB.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFC1F0C8' }
      };
    }
  });

  // ============================================
  // 4. Aplicar formato de número a columnas D y F
  // ============================================
  // Columna D (precio) - 2 decimales
  sheet.getColumn(4).numFmt = '#,##0.00';
  // Columna F (Un Caja) - entero (sin decimales)
  sheet.getColumn(6).numFmt = '#,##0';
  // Las columnas G y H no tienen formato especial porque están vacías

  // ============================================
  // 5. Ajustar ancho de columnas
  // ============================================
  sheet.getColumn(1).width = 5;   // A (vacío)
  sheet.getColumn(2).width = 18;  // Código
  sheet.getColumn(3).width = 60;  // Producto
  sheet.getColumn(4).width = 20;  // Precio
  sheet.getColumn(5).width = 10;  // Un Palet
  sheet.getColumn(6).width = 12;  // Un Caja
  sheet.getColumn(7).width = 15;  // Cantidad de pedido
  sheet.getColumn(8).width = 18;  // Importe (vacío)

  // ============================================
  // 6. Aplicar autofiltro a la fila de encabezados (fila 11)
  // ============================================
  sheet.autoFilter = {
    from: { row: 11, column: 1 },
    to: { row: 11, column: 8 }
  };

  // ============================================
  // 7. Congelar paneles (opcional)
  // ============================================
  sheet.views = [
    { state: 'frozen', xSplit: 1, ySplit: 11, topLeftCell: 'B12', activeCell: 'B12' }
  ];

  // Generar buffer
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer as ArrayBuffer);
};