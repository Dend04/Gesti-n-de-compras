import * as xlsx from 'xlsx';
import { writeFile } from 'fs/promises';

export const convertExcelToCsv = async (inputPath: string, outputPath: string): Promise<string> => {
  try {
    const workbook = xlsx.readFile(inputPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const csv = xlsx.utils.sheet_to_csv(worksheet);
    await writeFile(outputPath, csv, 'utf8');
    return outputPath;
  } catch (error) {
    throw new Error(`Error al convertir Excel a CSV: ${error instanceof Error ? error.message : String(error)}`);
  }
};