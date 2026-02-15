import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/cbs-react/',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-hot-toast')) {
              return 'react-vendor'
            }
            if (id.includes('maplibre-gl') || id.includes('react-map-gl')) {
              return 'map-vendor'
            }
            if (id.includes('@turf') || id.includes('xlsx') || id.includes('shpjs') || id.includes('togeojson')) {
              return 'data-vendor'
            }
            if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('ag-grid')) {
              return 'ui-vendor'
            }
            if (id.includes('chroma-js') || id.includes('d3-') || id.includes('simple-statistics')) {
              return 'utils-vendor'
            }
            return 'vendor'
          }
          
          // Feature chunks
          if (id.includes('src/features/astronomy')) return 'astronomy'
          if (id.includes('src/features/viz-wizard')) return 'viz-wizard'
          if (id.includes('src/features/data-import')) return 'data-import'
        },
      },
    },
    chunkSizeWarningLimit: 1000, // 1MB'a çıkar
  },
})
