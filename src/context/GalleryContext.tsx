// src/context/GalleryContext.tsx
// Wraps the whole app so Timeline, Categories and Storage all share
// the same scanned images and selection state.

import React, { createContext, useContext, ReactNode } from 'react';
import { useGallery } from '../hooks/useGallery';

type GalleryContextType = ReturnType<typeof useGallery>;

const GalleryContext = createContext<GalleryContextType | null>(null);

export function GalleryProvider({ children }: { children: ReactNode }) {
  const gallery = useGallery();
  return (
    <GalleryContext.Provider value={gallery}>
      {children}
    </GalleryContext.Provider>
  );
}

export function useGalleryContext(): GalleryContextType {
  const ctx = useContext(GalleryContext);
  if (!ctx) throw new Error('useGalleryContext must be used inside GalleryProvider');
  return ctx;
}
