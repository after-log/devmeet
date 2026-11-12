import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 배포하면 업데이트 버튼을 누르지 않아도 새 버전이 바로 적용되게 한다.
      registerType: 'autoUpdate',
      includeManifestIcons: false, // PNG icons are already covered by globPatterns below.
      manifest: {
        id: '/',
        name: 'devmeet — 코드 밖의 연결',
        short_name: 'devmeet',
        description: '취향과 일상의 결이 맞는 사람을 만나는 devmeet',
        lang: 'ko',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#1e1f22',
        background_color: '#1e1f22',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg}'],
        // Only the application shell is cached; account data and photos stay on the network.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/api(?:\/|$)/, /^\/oauth2(?:\/|$)/, /^\/login(?:\/|$)/],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    proxy: {
      '/api': 'http://127.0.0.1:8080',
      '/oauth2': 'http://127.0.0.1:8080',
      '/login/oauth2': 'http://127.0.0.1:8080',
    },
  },
  preview: { port: 4173 },
});
