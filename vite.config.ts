import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Cache app shell assets aggressively; Firestore data stays live
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        runtimeCaching: [
          {
            // Firebase CDN — cache-first so auth/firestore SDK loads instantly
            urlPattern: /^https:\/\/www\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'gstatic', expiration: { maxAgeSeconds: 86400 * 30 } },
          },
        ],
      },
      manifest: {
        name: 'Pendar — Belajar Web3',
        short_name: 'Pendar',
        description: 'Pendar — belajar web3 dengan langsung praktik on-chain',
        theme_color: '#f0a93b',
        background_color: '#0e0e11',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
})
