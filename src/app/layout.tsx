
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PWAInstallPrompt, OfflineIndicator } from '@/components/PWAInstallPrompt';

export const metadata: Metadata = {
  title: 'Brutal Score | JEE Advanced Mock Test',
  description: 'High-performance mock test platform for JEE Advanced aspirants',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Brutal Score',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect fill='%230f172a' width='192' height='192'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='100' font-weight='bold' fill='white' font-family='system-ui'>BS</text></svg>" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="font-body antialiased bg-white">
        <OfflineIndicator />
        {children}
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
