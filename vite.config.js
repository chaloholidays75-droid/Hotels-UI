import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
    base: '/',
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: 'static.json', // MUST be in project root
          dest: ''            // copies to dist root
        }
      ]
    })
  ],
  build: {
    outDir: 'dist', // default output folder
  }
})
