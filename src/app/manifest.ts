
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Brutal Score | JEE Advanced Mock Test',
    short_name: 'Brutal Score',
    description: 'High-performance mock test platform for JEE Advanced aspirants',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    icons: [
      {
        src: 'https://placehold.co/192x192/0f172a/ffffff?text=BS',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://placehold.co/512x512/0f172a/ffffff?text=BS',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
