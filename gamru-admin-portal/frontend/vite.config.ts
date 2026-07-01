import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  // Used by `npm start` (vite preview) when serving the built app as a
  // Render *Web Service*. Binds to 0.0.0.0:$PORT so Render detects the port,
  // and allows the *.onrender.com host. (For a Render *Static Site* this is
  // not used — the CDN serves dist/ directly.)
  preview: {
    host: true,
    port: Number(process.env.PORT) || 4173,
    allowedHosts: true,
  },
});
