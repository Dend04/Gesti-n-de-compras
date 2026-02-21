'use client';

import { ImportedFile } from '@/types/file';
import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface FileViewerProps {
  file: ImportedFile;
  onClose: () => void;
}

export default function FileViewer({ file, onClose }: FileViewerProps) {
  const [data, setData] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Papa.parse(file.content, {
      complete: (result) => {
        setData(result.data as string[][]);
        setLoading(false);
      },
      error: () => {
        setLoading(false);
      },
    });
  }, [file.content]);

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 truncate">{file.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-gray-400">Cargando...</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="divide-y divide-gray-200">
                  {data.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex === 0 ? 'bg-gray-50' : ''}>
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className={`px-4 py-2 text-sm ${
                            rowIndex === 0
                              ? 'font-medium text-gray-700'
                              : 'text-gray-500'
                          } border-r last:border-r-0`}
                        >
                          {cell || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}