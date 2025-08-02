import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Ensure base path is root
  build: {
    outDir: 'dist', // Output directory for Netlify
    assetsDir: 'assets',
    sourcemap: false, // Disable sourcemaps for production
  },
  // Preview server config (for local testing)
  preview: {
    port: 4173,
    host: true
  }
})
