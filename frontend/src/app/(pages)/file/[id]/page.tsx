'use client';

import { useFiles } from '@/context/FilesContext';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import Link from 'next/link';
import { ArrowLeftIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

export default function FilePage() {
  const { id } = useParams();
  const decodedId = decodeURIComponent(id as string);
  const { files } = useFiles();
  const [data, setData] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const file = files.find(f => f.id === decodedId);

  useEffect(() => {
    if (!file) {
      setError('Archivo no encontrado');
      setLoading(false);
      return;
    }

    Papa.parse(file.content, {
      complete: (result) => {
        setData(result.data as string[][]);
        setLoading(false);
      },
      error: () => {
        setError('Error al parsear el archivo');
        setLoading(false);
      },
    });
  }, [file]);

  const handleDownloadFormatted = async () => {
    if (!file || file.type !== 'excel creado') return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/excel/download-formatted`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: file.content, 
          filename: file.name.replace(/\.csv$/, '') 
        }),
      });

      if (!response.ok) throw new Error('Error al generar Excel');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace(/\.csv$/, '.xlsx');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error al descargar el archivo formateado');
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">Cargando archivo...</div>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Archivo no encontrado'}</p>
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Volver al dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header minimalista */}
      <header className="bg-white border-b border-gray-200 shrink-0">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <Link
                href="/"
                className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                title="Volver al dashboard"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <h1 className="text-lg font-medium text-gray-900 truncate">
                {file.name}
              </h1>
              {file.type === 'excel creado' && (
                <button
                  onClick={handleDownloadFormatted}
                  className="text-gray-400 hover:text-green-600 transition-colors shrink-0"
                  title="Descargar Excel con formato"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                </button>
              )}
            </div>
            <span className="text-sm text-gray-400 capitalize shrink-0 ml-4">
              {file.type}
            </span>
          </div>
        </div>
      </header>

      {/* Contenido del CSV - ocupa el espacio restante */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full overflow-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="bg-white font-mono text-sm">
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex === 0 ? 'bg-gray-50' : 'hover:bg-gray-50'}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-4 py-2 border-b border-gray-100 whitespace-nowrap"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}