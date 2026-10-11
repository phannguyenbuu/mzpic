import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5176,
    strictPort: true,
    host: true,
    open: false,
    proxy: {
      // ToolXPrint AI Render Bridge trên VPS (https://render.toolxprint.com)
      '/render-job': {
        target: 'https://render.toolxprint.com',
        changeOrigin: true,
        secure: false,
      },
      '/render-jobs': {
        target: 'https://render.toolxprint.com',
        changeOrigin: true,
        secure: false,
      },
      '/render-edit-job': {
        target: 'https://render.toolxprint.com',
        changeOrigin: true,
        secure: false,
      },
      '/render-files': {
        target: 'https://render.toolxprint.com',
        changeOrigin: true,
        secure: false,
      },
      '/render-thumbnail': {
        target: 'https://render.toolxprint.com',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'https://render.toolxprint.com',
        changeOrigin: true,
        secure: false,
      },
      // ToolXPrint Python AI Services trên VPS (https://toolxprint.com)
      '/api/remove-bg': {
        target: 'https://toolxprint.com',
        changeOrigin: true,
        secure: false,
      },
      '/api/chat': {
        target: 'https://render.toolxprint.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
