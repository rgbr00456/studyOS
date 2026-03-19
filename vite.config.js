import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  // App lives at /app on the deployed site
  base: '/app',
  build: {
    target: 'es2020',
    outDir: 'dist'
  }
})
