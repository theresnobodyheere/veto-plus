import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(`v${pkg.version} (${new Date().toISOString().slice(0, 10)})`) },
  // Chemin relatif : fonctionne quel que soit le nom du dépôt GitHub Pages
  base: './',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Véto+ — aide au diagnostic',
        short_name: 'Véto+',
        description: "Aide au diagnostic vétérinaire mixte : analyses, diagnostic différentiel, médicaments ANMV.",
        lang: 'fr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f2f2f7',
        theme_color: '#f2f2f7',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Tout est mis en cache à l'installation : l'appli fonctionne entièrement hors ligne
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}', 'data/*.json'],
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
        navigateFallback: 'index.html',
        // Contrôle la page dès la première visite (hors ligne disponible immédiatement)
        clientsClaim: true,
      },
    }),
  ],
  build: { target: 'safari16', sourcemap: false },
});
