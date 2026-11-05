
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/SustansyaBox/frontend/',
  build: {
    outDir: 'C:/xampp/HTDOCS/htdocs/SustansyaBox/frontend',
    emptyOutDir: true,
  },
})
