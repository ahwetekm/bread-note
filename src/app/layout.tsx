import type { Metadata, Viewport } from 'next';
import { SessionProvider } from '@/components/providers/session-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { PWAProvider } from '@/components/providers/pwa-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bread Note - Offline-First Note Taking',
  description: 'A modern, offline-first PWA note-taking application',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Bread Note',
  },
};

export const viewport: Viewport = {
  themeColor: '#030712',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <SessionProvider>
          <QueryProvider>
            <PWAProvider>
              {children}
            </PWAProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
