'use client';

import { SessionProvider } from "next-auth/react";
import { useSession } from "next-auth/react"; // если нужно где-то в layout
import './globals.css';
import { Inter } from 'next/font/google';
import Snowfall from 'react-snowfall';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className + " bg-zinc-950 text-white min-h-screen"}>
        <SessionProvider>  {/* ← без session пропа — будет запрашивать сам */}
          {children}
          <Snowfall 
            snowflakeCount={150}
            style={{ zIndex: 9999, pointerEvents: 'none' }}
            color="#fff"
          />
        </SessionProvider>

        <footer className="fixed bottom-0 left-0 right-0 bg-black/80 py-3 text-center text-xs text-zinc-500 border-t border-zinc-800">
          © 2026 swagin.ru — принадлежит Маткову К.А. и организации «Сетка». 
          Все права защищены. Политика конфиденциальности.
        </footer>
      </body>
    </html>
  );
}