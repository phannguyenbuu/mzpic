import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5176,
    strictPort: true,
    host: true,
    open: false,
    proxy: {
      // 1. ToolXPrint GenAI VPS Hub (https://genai.toolxprint.com)
      '/api': {
        target: 'https://genai.toolxprint.com',
        changeOrigin: true,
        secure: false,
      },
      '/images': {
        target: 'https://genai.toolxprint.com',
        changeOrigin: true,
        secure: false,
      },
      // 2. ToolXPrint PrintAgent Render Bridge (https://render.toolxprint.com)
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
      }
    }
  }
});
