import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react', 'react-dom', '@mysten/dapp-kit', '@tanstack/react-query'],
    esbuildOptions: {
      supported: {
        'top-level-await': true
      },
      define: {
        global: 'globalThis'
      }
    }
  },
  define: {
    global: 'globalThis'
  }
})
