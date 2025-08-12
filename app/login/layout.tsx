// app/login/layout.tsx
import Image from 'next/image';
import { ReactNode } from 'react';

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Background image */}
      <Image
        src="/background-lines.jpg"
        alt="Abstract background"
        fill
        className="object-cover z-[-1]"
        priority
      />

      {/* Optional: overlay, if needed */}
    

      {/* Foreground content */}
      <main className="relative z-10 flex h-full w-full flex-col items-center justify-center">
        {children}
      </main>
    </div>
  );
}
