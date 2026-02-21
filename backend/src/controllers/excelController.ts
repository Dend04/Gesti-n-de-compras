import { Request, Response } from 'express';
import { convertExcelToCsv } from '../services/excelService';
import { deleteFile } from '../utils/fileUtils';
import path from 'path';

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