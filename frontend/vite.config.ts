import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The FastAPI backend defaults to port 9000 in this repo (8000 is often taken by
// other local services). Override with VITE_API_URL for a deployed API.
const apiTarget = process.env.VITE_API_PROXY ?? 'http://127.0.0.1:9000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
      // Uploaded dish photos are served by the backend, outside the /api
      // prefix, so they need their own proxy rule in dev.
      '/uploads': { target: apiTarget, changeOrigin: true },
    },
  },
  preview: { host: '0.0.0.0', allowedHosts: true },
});
