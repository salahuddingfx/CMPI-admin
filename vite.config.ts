import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
  },
  esbuild: {
    drop: ['console', 'debugger'],
  } as any,
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('sonner')) {
              return 'ui';
            }
            if (id.includes('recharts')) {
              return 'charts';
            }
          }
        },
      },
    },
    sourcemap: false,
  },
})
