'use client';

import { useState } from 'react';
import { useFiles } from '@/context/FilesContext';
import FileTable from '@/components/FileTable';
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addFile } = useFiles();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('excelFile', file);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/excel/convert`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Error al procesar el archivo');
      }

      const csvText = await response.text();
      const fileType: 'excel' | 'csv' = 
        file.type.includes('excel') || file.name.match(/\.xlsx?$/) ? 'excel' : 'csv';

      const importedFile = {
        id: `${Date.now()}-${file.name}`,
        name: file.name,
        type: fileType,
        content: csvText,
        importedAt: Date.now(),
      };

      addFile(importedFile);
      setFile(null);
      const fileInput = document.getElementById('file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-light text-gray-900 mb-8">Importar archivos</h1>

        {/* Tarjeta de subida */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                Selecciona un archivo Excel o CSV
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <DocumentArrowUpIcon className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                    </p>
                    <p className="text-xs text-gray-400">XLSX, XLS, CSV (máx. 10MB)</p>
                  </div>
                  <input
                    id="file"
                    type="file"
                    accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Archivo seleccionado: <span className="font-medium">{file.name}</span> ({(
                    file.size / 1024
                  ).toFixed(2)} KB)
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Procesando...' : 'Importar'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Tabla de archivos */}
        <FileTable />
      </div>
    </main>
  );
}