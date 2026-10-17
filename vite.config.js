import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // The camera API requires a secure context. localhost counts as secure,
    // but to test the scanner from a phone on your LAN, run `npm run dev -- --host`
    // behind an HTTPS tunnel (e.g. `npx localtunnel --port 5173`).
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Firebase and the QR decoder change on different schedules than the
        // app code, so they get their own long-lived cache entries.
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          scanner: ['html5-qrcode'],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
