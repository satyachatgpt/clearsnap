import React, { createContext, useContext, ReactNode } from 'react';
import { useGallery } from '../hooks/useGallery';

type GalleryContextType = ReturnType<typeof useGallery>;
const GalleryContext = createContext<GalleryContextType | null>(null);

export function GalleryProvider({ children }: { children: ReactNode }) {
  const gallery = useGallery();
  return <GalleryContext.Provider value={gallery}>{children}</GalleryContext.Provider>;
}

export function useGalleryContext() {
  const ctx = useContext(GalleryContext);
  if (!ctx) throw new Error('useGalleryContext must be inside GalleryProvider');
  return ctx;
}
