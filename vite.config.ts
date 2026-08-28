import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Siehe src/lib/leer.ts: hält ungenutzte jsPDF-Abhängigkeiten aus dem Bündel.
const LEER = fileURLToPath(new URL('./src/lib/leer.ts', import.meta.url))

// Der Basispfad muss zum GitHub-Pages-Unterpfad passen: https://<user>.github.io/app_awt_berichte/
const BASE = '/app_awt_berichte/'

export default defineConfig({
  base: BASE,
  resolve: {
    alias: {
      html2canvas: LEER,
      canvg: LEER,
      dompurify: LEER,
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'icon-maskable-512.png',
      ],
      manifest: {
        name: 'Baustellenbericht',
        short_name: 'Bericht',
        description: 'Baustellenberichte offline erfassen und als PDF oder Word ausgeben.',
        lang: 'de',
        dir: 'ltr',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#FFC400',
        background_color: '#FFFFFF',
        categories: ['business', 'productivity'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App-Shell komplett vorab in den Cache legen -> App startet im Flugmodus.
        // `pdf` ist die Anleitung: Sie soll auch auf der Baustelle ohne Empfang
        // aufgehen. Kostet einmalig knapp 2 MB beim Installieren.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff,woff2,pdf}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        navigateFallback: `${BASE}index.html`,
        // Bewusst KEINE Runtime-Caching-Regeln für fremde Hosts: die App spricht mit niemandem.
        runtimeCaching: [],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
