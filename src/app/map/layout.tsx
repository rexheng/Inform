'use client';
import { useEffect } from 'react';

export default function MapLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.style.display = 'block';
    document.body.style.justifyContent = '';
    document.body.style.padding = '0';
    return () => {
      document.body.style.display = '';
      document.body.style.justifyContent = '';
    };
  }, []);

  return <>{children}</>;
}
