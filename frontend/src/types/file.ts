export type FileType = 'excel' | 'csv' | 'excel creado';

export interface ImportedFile {
  id: string;
  name: string;
  type: FileType;
  content: string;
  importedAt: number;
}