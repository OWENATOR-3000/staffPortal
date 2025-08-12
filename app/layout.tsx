// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
// 1. Import the new Providers component
import { Providers } from './providers'; 
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Staff Portal',
  description: 'Internal Staff Portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
         {/* 
        Add suppressHydrationWarning={true} to the body tag.
        This is the recommended way to handle unavoidable mismatches
        caused by browser extensions.
      */}
      {/* The body tag itself doesn't need any special classes now */}
      <body className={inter.className} suppressHydrationWarning={true}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}