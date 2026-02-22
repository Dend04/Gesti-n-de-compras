import { Request, Response } from 'express';
import { convertExcelToCsv } from '../services/excelService';
import { deleteFile } from '../utils/fileUtils';
import path from 'path';
import { processTicket } from '../services/ticketService';
import { generateFormattedExcel } from '../services/excelFormatter';
import { processTicketAndSinStock } from '../services/ticketCompletoService';
import { generateSinStockExcel } from '../services/excelSinStockFormatter';

export const uploadAndConvert = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'No se ha subido ningún archivo.' });
    return;
  }

  const inputPath = req.file.path;
  const outputFileName = `${req.file.filename.split('.')[0]}.csv`;
  const outputPath = path.join('uploads', outputFileName);

  try {
    await convertExcelToCsv(inputPath, outputPath);

    res.download(outputPath, outputFileName, async (err) => {
      if (err) {
        console.error('Error al enviar el archivo:', err);
      }
      // Limpiar archivos temporales
      await deleteFile(inputPath);
      await deleteFile(outputPath);
    });
  } catch (error) {
    await deleteFile(inputPath);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Error desconocido' });
  }
};

export const createTicket = async (req: Request, res: Response): Promise<void> => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  if (!files?.excelFile || !files?.csvFile) {
    res.status(400).json({ error: 'Se requieren un archivo Excel y un CSV' });
    return;
  }

  const excelFile = files.excelFile[0];
  const csvFile = files.csvFile[0];

  try {
    const { ticketCsv, sinStockCsv } = await processTicketAndSinStock(
      excelFile.path,
      csvFile.path
    );

    // Responder con ambos CSV
    res.json({
      ticketCsv,
      sinStockCsv,
      ticketFileName: `Ticket_${excelFile.originalname.replace(/\.[^/.]+$/, '')}.csv`,
      sinStockFileName: `SinStock_${excelFile.originalname.replace(/\.[^/.]+$/, '')}.csv`,
    });

    // Limpiar archivos temporales
    await deleteFile(excelFile.path);
    await deleteFile(csvFile.path);
  } catch (error) {
    await deleteFile(excelFile.path);
    await deleteFile(csvFile.path);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Error desconocido' });
  }
};

export const downloadFormattedExcel = async (req: Request, res: Response): Promise<void> => {
  const { content, filename } = req.body;
  if (!content || !filename) {
    res.status(400).json({ error: 'Falta contenido o nombre de archivo' });
    return;
  }

  try {
    const buffer = await generateFormattedExcel(content, filename);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Error al generar Excel:', error);
    res.status(500).json({ error: 'Error al generar el archivo Excel' });
  }
};

export const downloadSinStockExcel = async (req: Request, res: Response): Promise<void> => {
  const { content, filename } = req.body;
  if (!content || !filename) {
    res.status(400).json({ error: 'Falta contenido o nombre de archivo' });
    return;
  }

  try {
    const buffer = await generateSinStockExcel(content, filename);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Error al generar Excel de sin stock:', error);
    res.status(500).json({ error: 'Error al generar el archivo Excel' });
  }
};
