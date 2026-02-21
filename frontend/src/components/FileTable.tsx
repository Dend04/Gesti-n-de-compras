'use client';

import { useFiles } from '@/context/FilesContext';
import { formatRelativeDate, formatExactTime } from '@/utils/dateUtils';
import Link from 'next/link';
import { EyeIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function FileTable() {
  const { files, removeFile, clearAll } = useFiles();

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
        <button
          onClick={clearAll}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Limpiar todo
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
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