'use client';

import { ReactNode } from 'react';
import { Viewer3DConfigProvider } from '@/hooks/useViewer3DConfig';

interface Viewer3DProviderProps {
  children: ReactNode;
}

export function Viewer3DProvider({ children }: Viewer3DProviderProps) {
  return (
    <Viewer3DConfigProvider>
      {children}
    </Viewer3DConfigProvider>
  );
}
