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
    },
  },
  preview: { host: '0.0.0.0', allowedHosts: true },
});
