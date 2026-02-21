'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ImportedFile } from '@/types/file';

interface FilesContextType {
  files: ImportedFile[];
  addFile: (file: ImportedFile) => void;
  removeFile: (id: string) => void;
  clearAll: () => void;
}

const FilesContext = createContext<FilesContextType | undefined>(undefined);

const STORAGE_KEY = 'imported-files';

export function FilesProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<ImportedFile[]>([]);

  // Cargar desde localStorage al montar
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setFiles(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing stored files', e);
      }
    }
  }, []);

  // Guardar en localStorage cada vez que cambie la lista
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  }, [files]);

  const addFile = (file: ImportedFile) => {
    setFiles(prev => [file, ...prev]); // Más reciente primero
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAll = () => setFiles([]);

  return (
    <FilesContext.Provider value={{ files, addFile, removeFile, clearAll }}>
      {children}
    </FilesContext.Provider>
  );
}

export function useFiles() {
  const context = useContext(FilesContext);
  if (context === undefined) {
    throw new Error('useFiles must be used within a FilesProvider');
  }
  return context;
}