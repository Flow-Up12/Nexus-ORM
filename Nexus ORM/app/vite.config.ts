import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  root: __dirname,
  base: '/ufo-studio/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/ufo-studio': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/yjs': {
        target: 'ws://localhost:3001',
        ws: true,
      },
      '/file-sync': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
