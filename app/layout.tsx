// app/layout.tsx
import './globals.css'; // ⚡ importa tu CSS global aquí
import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
