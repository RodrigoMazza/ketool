import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-libs': ['pdf-lib', 'pdfjs-dist'],
          'supabase': ['@supabase/supabase-js'],
          'qrcode': ['qrcode'],
        },
      },
    },
  },
})
