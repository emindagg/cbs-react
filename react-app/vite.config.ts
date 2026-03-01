import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const STORYMAP_PREFIX = '/cbs-react/storymap'
const STORYMAP_DIR = path.resolve(__dirname, 'storymap')

const mime: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
}

function serveStorymap() {
  return {
    name: 'serve-storymap',
    configureServer(server: { middlewares: { use: (fn: (req: any, res: any, next: () => void) => void) => void } }) {
      server.middlewares.use((req: { url?: string }, res: { setHeader: (a: string, b: string) => void; statusCode: number; end: (c?: string) => void }, next: () => void) => {
        let url = req.url ?? ''
        const q = url.indexOf('?')
        if (q !== -1) url = url.slice(0, q)
        if (!url.startsWith(STORYMAP_PREFIX)) {
          next()
          return
        }
        const subPath = url.slice(STORYMAP_PREFIX.length).replace(/^\//, '') || 'index.html'
        let filePath = path.resolve(STORYMAP_DIR, subPath)
        if (!filePath.startsWith(STORYMAP_DIR + path.sep) && filePath !== STORYMAP_DIR) {
          next()
          return
        }
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, 'index.html')
        }
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
          next()
          return
        }
        const ext = path.extname(filePath)
        const type = mime[ext] ?? 'application/octet-stream'
        res.setHeader('Content-Type', type)
        res.statusCode = 200
        const stream = fs.createReadStream(filePath)
        stream.on('error', () => { next() })
        stream.pipe(res)
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  base: '/cbs-react/',
  plugins: [react(), serveStorymap()],
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
