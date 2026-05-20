import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const STORYMAP_PREFIX = '/cbs-react/storymap'
const STORYMAP_DIR = path.resolve(__dirname, 'storymap')
const VERSION_FILE = path.resolve(__dirname, 'version.json')

const VIDEO_MODAL_PREFIX = '/cbs-react/video-modal'
const VIDEO_MODAL_DIR = path.resolve(__dirname, 'video-modal')

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
      server.middlewares.use((req: any, res: any, next: () => void) => {
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

function copyStorymapToDist() {
  return {
    name: 'copy-storymap-to-dist',
    closeBundle() {
      const distStorymapDir = path.resolve(__dirname, 'dist/storymap')
      if (!fs.existsSync(STORYMAP_DIR) || !fs.statSync(STORYMAP_DIR).isDirectory()) {
        return
      }
      fs.rmSync(distStorymapDir, { recursive: true, force: true })
      fs.cpSync(STORYMAP_DIR, distStorymapDir, { recursive: true })
      applyStorymapCacheBusting(distStorymapDir)
    },
  }
}

function getBuildVersion() {
  const buildStamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14)

  try {
    const versionJson = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'))
    const version = String(versionJson.version || versionJson.build || '').trim()
    if (version) return `${version}-${buildStamp}`
  } catch {
    // version.json prebuild sırasında oluşur; yoksa zaman damgasına düş.
  }

  return buildStamp
}

function addOrReplaceVersion(url: string, version: string) {
  if (/^(?:https?:)?\/\//.test(url) || url.startsWith('data:') || url.startsWith('#')) {
    return url
  }

  const [pathAndQuery, hash = ''] = url.split('#')
  const [assetPath, query = ''] = pathAndQuery.split('?')
  const params = new URLSearchParams(query)
  params.set('v', version)
  const nextQuery = params.toString()

  return `${assetPath}${nextQuery ? `?${nextQuery}` : ''}${hash ? `#${hash}` : ''}`
}

function versionHtmlAssets(content: string, version: string) {
  return content.replace(
    /\b(src|href)=["']([^"']+\.(?:js|css))(\?[^"']*)?(#[^"']*)?["']/g,
    (_match, attr: string, assetPath: string, query = '', hash = '') => {
      const nextUrl = addOrReplaceVersion(`${assetPath}${query}${hash}`, version)
      return `${attr}="${nextUrl}"`
    },
  )
}

function versionStaticImports(content: string, version: string) {
  return content.replace(
    /\bfrom\s+["']([^"']+\.js)(\?[^"']*)?(#[^"']*)?["']/g,
    (_match, assetPath: string, query = '', hash = '') => {
      const nextUrl = addOrReplaceVersion(`${assetPath}${query}${hash}`, version)
      return `from '${nextUrl}'`
    },
  )
}

function listFilesRecursive(dir: string, extension: string) {
  if (!fs.existsSync(dir)) return []

  const files: string[] = []
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(entryPath, extension))
      return
    }
    if (entry.isFile() && entryPath.endsWith(extension)) {
      files.push(entryPath)
    }
  })

  return files
}

function applyStorymapCacheBusting(distStorymapDir: string) {
  const version = getBuildVersion()
  const htmlFiles = ['index.html', 'app.html', 'view.html', 'LoginRedirect.html']

  htmlFiles.forEach((fileName) => {
    const filePath = path.join(distStorymapDir, fileName)
    if (!fs.existsSync(filePath)) return

    const content = fs.readFileSync(filePath, 'utf8')
    fs.writeFileSync(filePath, versionHtmlAssets(content, version), 'utf8')
  })

  listFilesRecursive(path.join(distStorymapDir, 'src'), '.js').forEach((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8')
    fs.writeFileSync(filePath, versionStaticImports(content, version), 'utf8')
  })
}

function serveVideoModal() {
  return {
    name: 'serve-video-modal',
    configureServer(server: { middlewares: { use: (fn: (req: any, res: any, next: () => void) => void) => void } }) {
      server.middlewares.use((req: any, res: any, next: () => void) => {
        let url = req.url ?? ''
        const q = url.indexOf('?')
        if (q !== -1) url = url.slice(0, q)
        if (!url.startsWith(VIDEO_MODAL_PREFIX)) {
          next()
          return
        }
        const subPath = url.slice(VIDEO_MODAL_PREFIX.length).replace(/^\//, '') || 'index.html'
        let filePath = path.resolve(VIDEO_MODAL_DIR, subPath)
        if (!filePath.startsWith(VIDEO_MODAL_DIR + path.sep) && filePath !== VIDEO_MODAL_DIR) {
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

function copyVideoModalToDist() {
  return {
    name: 'copy-video-modal-to-dist',
    closeBundle() {
      const distVideoModalDir = path.resolve(__dirname, 'dist/video-modal')
      if (!fs.existsSync(VIDEO_MODAL_DIR) || !fs.statSync(VIDEO_MODAL_DIR).isDirectory()) {
        return
      }
      fs.rmSync(distVideoModalDir, { recursive: true, force: true })
      fs.cpSync(VIDEO_MODAL_DIR, distVideoModalDir, { recursive: true })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  base: '/cbs-react/',
  plugins: [react(), serveStorymap(), copyStorymapToDist(), serveVideoModal(), copyVideoModalToDist()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            const match = id.match(/node_modules[\\/](?:\.pnpm[\\/](?:@[^\\/+]+\+[^\\/]+|[^\\/]+)[\\/]node_modules[\\/])?((?:@[^\\/]+[\\/])?[^\\/]+)/)
            const pkg = match?.[1] ?? ''

            if (pkg === 'react' || pkg === 'react-dom' || pkg === 'scheduler') {
              return 'react-vendor'
            }
            if (pkg === 'maplibre-gl') {
              return 'map-vendor'
            }
            if (pkg === 'react-map-gl') {
              return 'map-react-vendor'
            }
            if (pkg === 'ag-grid-community' || pkg === 'ag-grid-react') {
              return 'aggrid-vendor'
            }
            if (pkg === 'recharts' || pkg.startsWith('victory-')) {
              return 'recharts-vendor'
            }
            if (pkg === 'jspdf' || pkg === 'html-to-image' || pkg === '@zumer/snapdom') {
              return 'export-vendor'
            }
            if (pkg.startsWith('@turf/') || pkg === 'xlsx' || pkg === 'shpjs' || pkg === 'togeojson'
              || pkg === '@tmcw/togeojson' || pkg === '@mapbox/shp-write' || pkg.startsWith('@placemarkio/')
              || pkg === 'fflate' || pkg === 'papaparse' || pkg === 'proj4' || pkg === 'polylabel'
              || pkg === 'topojson-client' || pkg === 'betterknown' || pkg === '@sakitam-gis/kriging') {
              return 'data-vendor'
            }
            if (pkg === 'framer-motion' || pkg === 'lucide-react' || pkg === 'rc-slider' || pkg === 'tailwind-merge' || pkg === 'clsx') {
              return 'ui-vendor'
            }
            if (pkg === 'chroma-js' || pkg.startsWith('d3-') || pkg === 'simple-statistics' || pkg === 'date-fns'
              || pkg === 'fuse.js' || pkg === 'uuid' || pkg === 'astronomy-engine' || pkg === 'zustand' || pkg === 'usehooks-ts') {
              return 'utils-vendor'
            }
            return 'vendor'
          }

          if (id.includes('src/features/astronomy')) return 'astronomy'
          if (id.includes('src/features/viz-wizard')) return 'viz-wizard'
          if (id.includes('src/features/data-management')) return 'data-management'
        },
      },
    },
    chunkSizeWarningLimit: 1100,
  },
})
