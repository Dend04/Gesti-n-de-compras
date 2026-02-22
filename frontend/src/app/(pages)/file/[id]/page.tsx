'use client';

import { useFiles } from '@/context/FilesContext';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface ProductRow {
  Almacén?: string;
  Código: string;
  Producto: string;
  'Precio Venta'?: number | string;
  'Cantidad Pedida'?: number | string;
  'Stock disponible'?: number | string;
  // ... otras columnas que puedan venir
}

export default function FilePage() {
  const { id } = useParams();
  const decodedId = decodeURIComponent(id as string);
  const { files } = useFiles();
  const [data, setData] = useState<ProductRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
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
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setHeaders(result.meta.fields || []);
        setData(result.data as ProductRow[]);
        setLoading(false);
      },
      error: () => {
        setError('Error al parsear el archivo');
        setLoading(false);
      },
    });
  }, [file]);

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

  // Determinar qué columnas mostrar. Queremos mostrar las mismas que en el Excel: Código, Producto, Precio Venta, Un Caja (Cantidad Pedida), etc.
  // Pero en el CSV generado por el backend, las columnas pueden tener nombres específicos. Supongamos que vienen con los nombres:
  // 'Código', 'Producto', 'Precio Venta', 'Cantidad Pedida', 'Stock disponible', etc.
  // Ajusta según los nombres reales.

  // Para formatear números
  const formatPrice = (price: any) => {
    const num = parseFloat(price);
    return isNaN(num) ? '' : num.toFixed(2);
  };

  const formatQuantity = (qty: any) => {
    const num = parseInt(qty);
    return isNaN(num) ? '' : num.toString();
  };

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
            </div>
            <span className="text-sm text-gray-400 capitalize shrink-0 ml-4">
              {file.type}
            </span>
          </div>
        </div>
      </header>

      {/* Contenido del CSV con estilos tipo Excel */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-auto">
          <table className="min-w-full divide-y divide-gray-200" style={{ fontFamily: 'Aptos Narrow, sans-serif', fontSize: '11pt' }}>
            <thead className="bg-gray-100">
              <tr>
                {/* Columna de selección? No, solo mostramos datos */}
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider bg-gray-100" style={{ fontWeight: 'bold' }}>
                  Código
                </th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider bg-gray-100" style={{ fontWeight: 'bold' }}>
                  Producto
                </th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider bg-gray-100" style={{ fontWeight: 'bold' }}>
                  Precio Venta
                </th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider bg-gray-100" style={{ fontWeight: 'bold' }}>
                  Un Caja
                </th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider bg-gray-100" style={{ fontWeight: 'bold' }}>
                  Stock
                </th>
                {/* Agrega más columnas si es necesario */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, index) => {
                const stock = parseFloat(row['Stock disponible'] as string);
                const isOutOfStock = stock === 0;
                const rowClass = isOutOfStock ? 'bg-red-100' : '';

                return (
                  <tr key={index} className={`hover:bg-gray-50 ${rowClass}`}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ backgroundColor: '#C1F0C8' }}>
                      {row['Código']}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {row['Producto']}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                      {formatPrice(row['Precio Venta'])}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                      {formatQuantity(row['Cantidad Pedida'])}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                      {formatQuantity(stock)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}