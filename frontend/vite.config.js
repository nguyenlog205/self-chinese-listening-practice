import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Electron loads dist/index.html via file:// once packaged -- Vite's
  // default root-absolute asset paths ("/assets/...") resolve against the
  // filesystem root under file://, not the html's own directory, so the
  // bundle 404s silently and the page stays blank. Relative paths fix that.
  base: "./",
  plugins: [react()],
})
