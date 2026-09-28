import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // MineMitra AI backend (server/index.js) — keeps the API key server-side only.
      // Run `npm run server` alongside `npm run dev` in development.
      proxy: {
        '/api': {
          target: `http://localhost:${process.env.PORT || 8787}`,
          changeOrigin: true,
        },
        '/socket.io': {
          target: `http://localhost:${process.env.PORT || 8787}`,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
