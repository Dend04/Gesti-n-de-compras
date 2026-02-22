'use client';

import { useFiles } from '@/context/FilesContext';
import { formatRelativeDate, formatExactTime } from '@/utils/dateUtils';
import Link from 'next/link';
import { EyeIcon, TrashIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { ImportedFile } from '@/types/file';

export default function FileTable() {
  const { files, removeFile, clearAll, addFile } = useFiles();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectedExcel = files.find(f => selectedIds.includes(f.id) && f.type === 'excel');
  const selectedCsv = files.find(f => selectedIds.includes(f.id) && f.type === 'csv');
  const canCreateTicket = selectedExcel && selectedCsv && selectedIds.length === 2;

  const handleCreateTicket = async () => {
    if (!selectedExcel || !selectedCsv) return;

    const formData = new FormData();
    formData.append('excelFile', new Blob([selectedExcel.content], { type: 'text/csv' }), selectedExcel.name);
    formData.append('csvFile', new Blob([selectedCsv.content], { type: 'text/csv' }), selectedCsv.name);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/excel/create-ticket`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Error al crear ticket');
      }

      const csvResult = await res.text();

      const newFile: ImportedFile = {
        id: `${Date.now()}-ticket-${selectedExcel.name}`,
        name: `Ticket_${selectedExcel.name.replace(/\.[^/.]+$/, '')}.csv`,
        type: 'excel creado',
        content: csvResult,
        importedAt: Date.now(),
      };

      addFile(newFile);
      setSelectedIds([]);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDownloadFormatted = async (file: ImportedFile) => {
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

  if (files.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-400 text-lg">No hay archivos importados</p>
        <p className="text-gray-400 text-sm mt-1">Sube un archivo para comenzar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Archivos importados</h2>
        <div className="flex gap-2">
          {canCreateTicket && (
            <button
              onClick={handleCreateTicket}
              className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md transition-colors"
            >
              Crear ticket de excel
            </button>
          )}
          <button
            onClick={clearAll}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Limpiar todo
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span className="sr-only">Seleccionar</span>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hora exacta
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {files.map((file) => (
              <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-2 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(file.id)}
                    onChange={() => toggleSelect(file.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {file.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {file.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatRelativeDate(file.importedAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatExactTime(file.importedAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/file/${file.id}`}
                    className="text-gray-400 hover:text-gray-600 mr-3 transition-colors inline-block"
                    title="Visualizar"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </Link>
                  {file.type === 'excel creado' && (
                    <button
                      onClick={() => handleDownloadFormatted(file)}
                      className="text-gray-400 hover:text-green-600 mr-3 transition-colors inline-block"
                      title="Descargar Excel con formato"
                    >
                      <DocumentArrowDownIcon className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Eliminar"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}