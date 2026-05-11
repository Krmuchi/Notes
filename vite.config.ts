import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/zustand')) return 'zustand';
          if (id.includes('node_modules/marked')) return 'marked';
          if (id.includes('node_modules/dompurify')) return 'dompurify';
          if (id.includes('node_modules/jszip')) return 'jszip';
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'marked', 'dompurify', 'jszip'],
  },
})