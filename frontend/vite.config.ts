import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    proxy: {
      '/api': { target: 'http://localhost:9060', changeOrigin: true },
      '/users': { target: 'http://localhost:9060', changeOrigin: true },
    },
  },
})
