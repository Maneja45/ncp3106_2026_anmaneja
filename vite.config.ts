
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const isGitHub = mode === 'github'

  return {
    plugins: [react()],

    base: isGitHub
      ? '/ncp3106_2026_anmaneja/'
      : '/SustansyaBox/frontend/',

    build: {
      outDir: isGitHub
        ? 'dist'
        : 'C:/xampp/HTDOCS/htdocs/SustansyaBox/frontend',

      emptyOutDir: true,
    },
  }
})
