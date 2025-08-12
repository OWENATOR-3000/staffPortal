// app/providers.tsx
"use client"; // This marks the component as a Client Component

import { AuthProvider } from '@/context/AuthContext';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  // You can wrap multiple providers here if you have more in the future
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}