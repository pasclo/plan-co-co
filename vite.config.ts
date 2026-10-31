import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Served from GitHub Pages at /plan-co-co/
export default defineConfig({
  base: '/plan-co-co/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Plan Co-Co',
        short_name: 'Plan Co-Co',
        description: 'Planificador de cenas y lista de la compra',
        lang: 'es',
        theme_color: '#2f7d4f',
        background_color: '#f7f5ef',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,mjs}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /mercadona-prices\.json$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'prices' },
          },
        ],
      },
    }),
  ],
  test: { environment: 'node' },
});
