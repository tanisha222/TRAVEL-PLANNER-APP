import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    proxy: {
      '/weather': 'http://localhost:5000',
      '/places': 'http://localhost:5000',
      '/hotels': 'http://localhost:5000',
      '/restaurants': 'http://localhost:5000'
    }
  }
})