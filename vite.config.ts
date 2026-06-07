import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_TARGET = `http://localhost:${process.env.API_PORT || 8787}`

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': API_TARGET },
  },
  preview: {
    proxy: { '/api': API_TARGET },
  },
})
