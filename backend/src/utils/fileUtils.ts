import { unlink } from 'fs/promises';

export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    await unlink(filePath);
    console.log(`Archivo eliminado: ${filePath}`);
  } catch (err) {
    console.error(`Error al eliminar archivo ${filePath}:`, err);
  }
};