import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// You'll need to know the full URL of your backend API server.
// For this example, I'll use the one from your previous code snippets.
const BACKEND_URL = 'https://backend.chaloholidayonline.com';

export default defineConfig({
  // The 'base' option is important if your app is not served from the root of a domain.
  // For most single-page applications, '/' is correct.
  base: '/',

  plugins: [
    react(),
    tailwindcss()
  ],

  // =========================================================================
  // This is the new part for the proxy configuration.
  // It's a key part of the 'server' object.
  // =========================================================================
  server: {
    // The 'proxy' object maps local paths to backend targets.
    proxy: {
      // The key '/api' means any request to your dev server
      // that starts with '/api' (e.g., 'http://localhost:5173/api/agency')
      // will be proxied.
      '/api': {
        // The 'target' is the full URL of your backend server.
        target: BACKEND_URL,
        
        // 'changeOrigin' is important. It tells the proxy to change the 'Host' header
        // of the request to match the target URL. This is often required by backends
        // that are hosted on a different domain.
        changeOrigin: true,

        // 'rewrite' is used to remove the '/api' prefix from the request path
        // before it's sent to the backend. In your case, the backend API is
        // `https://backend.chaloholidayonline.com/api/agency`, so you probably
        // don't need this, as the '/api' part should be kept. If your backend's
        // root was `https://backend.chaloholidayonline.com/` and the endpoint
        // was `/agency`, you would use:
        // rewrite: (path) => path.replace(/^\/api/, '')
        // But since your backend endpoint is already prefixed with 'api', we don't need to rewrite.
      },
    }
  },

  build: {
    outDir: 'dist', // default output folder
  }
})
