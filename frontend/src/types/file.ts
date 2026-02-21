export interface ImportedFile {
  id: string;           // Identificador único (timestamp + nombre)
  name: string;         // Nombre original del archivo
  type: 'excel' | 'csv'; // Tipo detectado
  content: string;      // Contenido CSV (para visualizar)
  importedAt: number;   // Timestamp de importación
}