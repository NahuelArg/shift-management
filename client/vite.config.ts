import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Expone en 0.0.0.0 (accesible desde la red)
    port: 5173,
    strictPort: false, // Si el puerto está ocupado, usa otro
  },
})
