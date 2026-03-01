# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**StoryMap** is a full-stack web application for creating interactive story maps with four different templates: Point-based, Route-based, Timeline, and StoryMap (scrollytelling). Built with vanilla JavaScript ES6 modules with backend integration for authentication and cloud storage.

**Core Tech Stack:**
- MapLibre GL JS v2+ for map rendering
- Turf.js v6 for geographic calculations
- TimelineJS v3 for timeline visualization
- OSRM (Open Source Routing Machine) for real road routing
- **Backend API** (ASP.NET Core) for authentication and data storage
- **MEBBİS OAuth** for teacher/student authentication
- **Dual-mode storage**: Backend (authenticated) + IndexedDB (fallback/cache)
- CDN for media file uploads
- BEM CSS methodology

## Development Setup

### Running the Application

The project requires a local web server (file:// protocol won't work due to ES6 modules):

```bash
# Option 1: Python 3
python -m http.server 8000

# Option 2: Node.js http-server
npx http-server -p 8000

# Option 3: VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

Then navigate to:
- `http://localhost:8000/index.html` - Main entry point (landing page)
- `http://localhost:8000/app.html` - Application (requires authentication)
- `http://localhost:8000/app.html?dev` - Development mode (no auth required, IndexedDB-only)
- `http://localhost:8000/view.html?code={publicKey}` - Public view

### Page Structure

**index.html** - Landing page with 3 options:
1. View shared map with public key (no auth)
2. Teacher login (MEBBİS OAuth - cbs/1)
3. Student login (MEBBİS OAuth - cbs/0)

**LoginRedirect.html** - MEBBİS callback handler
- Receives MEBBİS token
- Calls backend `/api/Login`
- Stores JWT token in sessionStorage
- Redirects to app.html

**app.html** - Main application (authenticated)
- Requires authentication (redirects to index.html if not logged in)
- Supports `?dev` parameter to skip auth and run in IndexedDB-only mode
- Shows StorymapManager (list of user's maps)
- Create new maps or open existing ones

**view.html** - Public viewing (no auth required)
- View shared maps via public key
- Read-only mode
- Caches to IndexedDB for offline viewing

### Admin Panel Access

Access admin panel by adding `?admin` to URL or using `#admin` hash:
- `http://localhost:8000?admin`
- `http://localhost:8000#admin`

## Architecture

### Modular Component System

The codebase follows strict modularity with components split into 3 layers:

1. **Renderers** (`renderers/`) - Generate HTML markup
2. **Handlers** (`handlers/`) - Manage event listeners
3. **Modules** (`modules/`) - Business logic and state

**Example: SidebarComponent structure:**
```
sidebar/
├── SidebarComponent.js     # Orchestrator
├── renderers/
│   ├── listViewRenderer.js      # HTML generation
│   ├── detailViewRenderer.js
│   └── settingsViewRenderer.js
├── handlers/
│   ├── listViewHandlers.js      # Event listeners
│   ├── detailHandlers.js
│   └── settingsHandlers.js
└── modules/
    ├── DetailPanel.js           # Business logic
    ├── PointManager.js
    ├── MediaManager.js
    └── Lightbox.js
```

### Component Communication Pattern

Components communicate via callback functions set on the orchestrator:

```javascript
// ModalComponent sets callbacks on SidebarComponent
this.sidebarComponent.onSave = async () => { /* save logic */ };
this.sidebarComponent.onPointAdd = (point) => { /* add to map */ };
this.sidebarComponent.onPointFocus = (point) => { /* fly to point */ };

// SidebarComponent invokes callbacks
if (this.onSave) this.onSave();
if (this.onPointAdd) this.onPointAdd(newPoint);
```

### Template-Based Behavior

Four templates with different features:
- **point**: Independent markers
- **route**: Connected markers with distance calculation
- **timeline**: Chronological events with TimelineJS integration
- **storymap**: Scrollytelling interface with multimedia

Template detection:
```javascript
const template = data.mapData?.template || 'point';
const isRouteTemplate = template === 'route';
const isTimelineTemplate = template === 'timeline';
const isStoryMapTemplate = template === 'storymap';
```

## Critical Architecture Patterns

### 1. State Management

**hasSaved Flag Pattern:**
The app tracks first save vs updates to change button text and toast messages:

```javascript
// In SidebarComponent.js
this.hasSaved = false;  // Set in constructor

// After successful save
this.sidebarComponent.updateSaveButtonText();
// Changes "Kaydet" → "Güncelle" and icon fa-save → fa-sync-alt
```

### 2. Dynamic Button Updates

Save buttons dynamically update after first save:
```javascript
updateSaveButtonText() {
    if (!this.hasSaved) {
        this.hasSaved = true;
        const saveButtons = this.container.querySelectorAll('#btn-save, #btn-save-point');
        // Update text to "Güncelle" and icon to fa-sync-alt
    }
}
```

### 3. Toast Notification System

**Single-message pattern:** Toast messages use only the `title` parameter, not both title and message:

```javascript
// ✅ CORRECT - Single message
toast.success('Haritanız başarıyla kaydedildi');

// ❌ WRONG - Redundant title + message
toast.success('Harita Kaydedildi', 'Haritanız başarıyla kaydedildi');
```

### 4. Custom Confirm Dialog

Native `confirm()` yerine modern `customConfirm()` kullanılıyor:

```javascript
import { customConfirm } from '../utils/customPrompt.js';

const confirmed = await customConfirm('Bu haritayı silmek istediğinizden emin misiniz?', {
    title: '',           // Boş bırakılırsa gösterilmez
    confirmText: 'Sil',
    cancelText: 'İptal',
    type: 'danger'       // 'danger', 'warning', 'info'
});

if (confirmed) {
    // Silme işlemi
}
```

### 5. Playback Controls

All playback controls (point-playback, timeline__controls, storymap-playback) share minimal design:
- Pill-shaped containers (border-radius: 24px)
- Compact sizing (32px icons, 24px speed buttons)
- Scale animations (hover: 1.05, active: 0.98)
- Subtle borders and shadows

### 5. Timeline Manual Refresh

**Important:** TimelineJS auto-update is disabled for performance. Users must click "Yenile" button:

```javascript
// Timeline updates are manual to prevent freeze
this.sidebarComponent.onRefreshTimelineJS = () => {
    // Reconstruct TimelineJS with new data
};
```

### 6. Storage Abstraction

Data persists to IndexedDB with localStorage fallback:

```javascript
import { storageManager } from './utils/storageManager.js';

// Save
const saved = await storageManager.saveMap(data);

// Load
const story = await storageManager.getMap(storyId);

// List all
const stories = await storageManager.getAllMaps();
```

## File Organization Conventions

### CSS Structure (BEM)

```
src/styles/
├── variables/
│   └── colors.css           # CSS custom properties
├── base/
│   └── reset.css            # Typography and reset
├── components/
│   ├── toolbar.css
│   ├── modal.css
│   ├── toast.css
│   └── sidebar/             # Sidebar sub-components
└── utilities/
    └── helpers.css
```

### Constants and Configuration

Template definitions: `src/data/templates.js`
Marker styles: `src/components/sidebar/constants/markerStyles.js`
Basemaps: `src/components/sidebar/constants/basemaps.js`

## Common Operations

### Adding a New Template

1. Add template definition in `src/data/templates.js`
2. Add mockup HTML in `index.html` modal preview section
3. Update template switch in `ModalComponent.js`
4. Add template-specific rendering logic

### Adding a New Drawing Tool

1. Add method to `MapDrawing.js` (e.g., `enableStarMode()`)
2. Add toolbar button in `index.html`
3. Register in `ToolManager.js`
4. Add icon SVG in toolbar section

### Modifying Marker Styles

Edit `src/components/sidebar/constants/markerStyles.js`:
```javascript
export const MARKER_STYLES = [
    {
        id: 'custom-style',
        name: 'Custom',
        icon: 'fa-star',
        bgColor: '#ff6b6b',
        shape: 'circle'
    }
];
```

### Adding New Basemap

Edit `src/components/sidebar/constants/basemaps.js`:
```javascript
export const BASEMAPS = [
    {
        id: 'custom-map',
        name: 'Custom Map',
        url: 'https://tile-server.com/{z}/{x}/{y}.png',
        attribution: '© Custom Provider'
    }
];
```

## Key Implementation Details

### Route Distance Calculation

Routes automatically calculate:
- **Distance between points** (using Turf.js geodesic distance)
- **Total route length** (sum of all segments)
- **Displacement** (straight-line distance from start to end)

Managed by `RouteManager.js` with automatic updates on point add/remove/reorder.

### Timeline Event Management

Timeline events have:
- Date/time fields for chronological ordering
- Category for color-coding
- Era (period) for grouping
- Importance level (1-5)

TimelineJS integration via `TimelineJSWrapper.js` handles data transformation.

### StoryMap Scrollytelling

Implements scroll-based narrative with:
- Fixed map on right, scrollable content on left
- Automatic map animations on section scroll
- IntersectionObserver for active section tracking
- Playback controls for auto-advance

### Media Management

Media files stored as base64 in IndexedDB:
- Max size: ~30MB per file (configurable)
- Supported: images (jpg, png, webp) and videos (mp4, webm)
- Lightbox viewer for full-screen display

## Performance Considerations

- **Lazy loading:** Components load on demand
- **Selective rendering:** Only changed layers redraw
- **Debounced events:** Scroll/resize throttled
- **Manual timeline refresh:** Prevents auto-update lag
- **IndexedDB limits:** ~50MB-1GB depending on browser

## Browser Compatibility

Requires modern browser with:
- ES6 modules support
- MapLibre GL JS support (WebGL)
- IndexedDB API
- CSS custom properties

Tested on: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## Turkish Language

This is a Turkish-language application. All UI text, comments, and user-facing strings are in Turkish. Variable/function names use English for code clarity.

---

## Backend Integration

### Overview

The application uses a **dual-mode storage** strategy:
- **Backend mode**: Authenticated users (MEBBİS OAuth) store data on backend
- **IndexedDB mode**: Unauthenticated users or fallback when backend is unavailable

### Authentication Flow

```javascript
// 1. User clicks "Öğretmen Girişi" on landing.html
// 2. Redirect to MEBBİS OAuth
window.location.href = 'https://mebi.eba.gov.tr/login/cbs/1?redirectUrl=.../LoginRedirect.html';

// 3. MEBBİS redirects back with URL-encoded token
// LoginRedirect.html receives: ?user={URL_ENCODED_MEBBIS_TOKEN}

// 4. Parse token WITHOUT decoding (backend expects URL-encoded)
const userMatch = window.location.search.match(/[?&]user=([^&]*)/);
const mebbisToken = userMatch[1]; // Keep URL-encoded

// 5. Backend login
const response = await apiService.login(mebbisToken);
// Returns: { data: { kullaniciid, token }, errorMessage }

// 6. Store JWT token
sessionStorage.setItem('storymap_auth_token', response.data.token);

// 7. Redirect to app.html
window.location.href = '/app.html';
```

**⚠️ Önemli**: Backend response formatı `{ data: {...}, errorMessage }` şeklinde. Key isimleri küçük harf (`kullaniciid`, `token`).

### Backend Response Format

**⚠️ Kritik**: Tüm backend endpoint'leri şu formatta dönüyor:

```javascript
{
  data: { ... },      // Asıl veri (object veya array)
  errorMessage: null  // Hata varsa string
}
```

**Key isimleri küçük harf:**
- `kullaniciid` (değil `Kullaniciid`)
- `token` (değil `Token`)
- `id`, `baslik`, `aciklama`, `sablon`, `jsondata`, `isshared`, `publickey`

**Doğru kullanım:**
```javascript
const response = await apiService.getAllStorymaps();
const items = response?.data || response || [];
const title = item.baslik || item.Baslik; // Fallback for both cases
```

### Core Services

**authManager.js** - Authentication management
```javascript
authManager.saveAuth(token, userId)
authManager.getToken()
authManager.isAuthenticated()
authManager.logout() // Clears session + redirects to landing
authManager.requireAuth() // Protects authenticated pages
```

**apiService.js** - Backend API wrapper
```javascript
// Storymap CRUD
apiService.getAllStorymaps()
apiService.getStorymap(id)
apiService.createStorymap(data)
apiService.updateStorymap(id, data)
apiService.deleteStorymap(id)

// Share/unshare
apiService.shareStorymap(id)
apiService.unshareStorymap(id)
apiService.getStorymapByPublicKey(publicKey) // No auth required

// File upload
apiService.uploadFile(file) // Returns CDN filename
apiService.getCDNUrl(filename) // Constructs full CDN URL
```

**storageManager.js** - Dual-mode storage
```javascript
// Mode detection
storageManager.isBackendMode() // Returns true if authenticated

// Unified API (auto-routes to backend or IndexedDB)
storageManager.saveMap(data)
storageManager.getMap(id, source)
storageManager.getAllMaps() // Returns backend + local hybrid
storageManager.deleteMap(id, source)

// Migration
storageManager.migrateMapToBackend(localId) // Upload local to backend
```

**migrationHelper.js** - Local → Backend migration
```javascript
migrationHelper.hasLocalMaps()
migrationHelper.getLocalMapsCount()
migrationHelper.migrateAllMaps(progressCallback)
```

### StorymapManager Component

Main UI for managing storymaps (replaces old template selection modal):

```javascript
// Location: src/components/StorymapManager.js
// Shows on app.html after authentication

Features:
- Lists backend + local maps (hybrid view)
- Source badges ("Backend" / "Lokal")
- Filtering (All / Backend / Local)
- Migration UI (single or bulk)
- Create new / Open / Delete actions
- Loading states + error handling
```

### Public Sharing

**⚠️ NOT: Backend'de `/api/Storymap/public/{publicKey}` endpoint'i henüz yok. Frontend hazır, backend bekleniyor.**

**Mevcut Durum:**
- Public key storymap oluşturulduğunda backend tarafından otomatik atanıyor
- `shareStorymap()` ve `unshareStorymap()` API'leri mevcut
- Ancak public key ile harita çekme endpoint'i yok

**Share Flow (Şu anki):**
```javascript
// 1. User clicks "Paylaş" in toolbar
// Public key zaten storymap'te var, sadece gösteriyoruz
const story = await apiService.getStorymap(id);
const publicKey = story.publickey || story.Publickey;

// 2. Share link generated
const shareUrl = `${window.location.origin}/view.html?code=${publicKey}`;
```

**Public View Flow (Backend endpoint gerekli):**
```javascript
// view.html?code={publicKey}
// 1. Parse public key from URL
// 2. Backend endpoint gerekli: GET /api/Storymap/public/{publicKey}
// Bu endpoint henüz yok!

// Denenen endpoint'ler (hepsi 404):
// - /api/Storymap/public/{publicKey}
// - /api/Storymap/publickey/{publicKey}
// - /api/Storymap/shared/{publicKey}
// - /api/Public/Storymap/{publicKey}
```

**Backend'e Gerekli Endpoint:**
```
GET /api/Storymap/public/{publicKey}
- Auth gerektirmemeli
- Response: { data: { id, baslik, aciklama, sablon, jsondata, ... }, errorMessage }
- Sadece isShared=true olan haritaları döndürmeli (opsiyonel güvenlik)
```

### Media Upload

**Authenticated users:**
```javascript
// MediaManager.js uploads to CDN
const cdnFilename = await apiService.uploadFile(file);
// Returns: "202601/abc123.jpg"

const cdnUrl = apiService.getCDNUrl(cdnFilename);
// Returns: "https://ogm-large-cdn.eba.gov.tr/Cbs/UserFiles/202601/abc123.jpg"
```

**Fallback (unauthenticated or error):**
```javascript
// Convert to base64 (stored in IndexedDB)
const base64 = await convertToBase64(file);
```

### Error Handling

```javascript
// apiService.js handles all HTTP errors
switch (status) {
    case 401: // Unauthorized
        authManager.logout(); // Clear token + redirect to landing
        break;
    case 403: // Forbidden
        toast.error('Yetkiniz bulunmuyor');
        break;
    case 404: // Not Found
        // Fallback to IndexedDB if available
        break;
    case 500: // Server Error
        toast.error('Sunucu hatası');
        break;
}
```

### CORS Configuration

**⚠️ Backend requirement:**
The backend must allow CORS from development origins. See `backendrehber.md` for ASP.NET Core configuration.

### Backend Documentation

For backend developers, see: **`backendrehber.md`**
- API endpoint specifications
- Data formats (Jsondata structure)
- Authentication flow details
- CORS configuration (ASP.NET Core)
- Test scenarios
- Security guidelines

---

## Important: No External Dependencies

This project intentionally uses no npm packages or build tools. All dependencies are loaded via CDN in `index.html`. Do not introduce bundlers, transpilers, or package.json unless explicitly requested.

---

## OSRM Routing Implementation

### Overview

The Route template uses OSRM (Open Source Routing Machine) to draw realistic road routes instead of straight lines between points. This solves the problem of routes crossing water/mountains (e.g., Mersin→Hatay crossing the Mediterranean Sea).

### Architecture

**Location**: `src/components/map/modules/RouteManager.js`

**Key Methods**:
- `fetchRealRoute(point1, point2)` - Fetches route from OSRM API
- `fetchAllRoutes()` - Fetches routes for all point pairs
- `updateRouteLine()` - Draws route on map (async)

### OSRM API

**Endpoint**: `https://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=full&geometries=geojson`

**Features**:
- ✅ Free, unlimited usage
- ✅ Global road network
- ✅ Returns 200-300 coordinates per route segment
- ✅ Follows real roads, bridges, tunnels

**Response Structure**:
```json
{
  "routes": [{
    "geometry": {
      "coordinates": [[lon, lat], [lon, lat], ...]
    },
    "distance": 123456,  // meters
    "duration": 7890     // seconds
  }]
}
```

### Cache Mechanism

**Implementation**: In-memory `Map` cache in RouteManager constructor

```javascript
this.routingCache = new Map();
```

**Cache Key**: `${lon1},${lat1}_${lon2},${lat2}`

**Benefits**:
- Prevents duplicate API calls for same route
- Instant redraw when editing route
- Cleared on page refresh (not persistent)

### Async Pattern

All route-related methods are async:

```javascript
// RouteManager.js
async addRoutePoint(point)
async connectAllPoints(points)
async updateRouteLine()

// MapComponent.js
async addRoutePoint(point)
async connectAllRoutePoints(points)

// ModalComponent.js callbacks
onRoutePointAdd: async (point) => { ... }
onConnectAllPoints: async () => { ... }
onPointStyleUpdate: async (point) => { ... }
```

**Critical**: Always await these methods to ensure route is drawn before proceeding.

### Fallback System

If OSRM API fails (network error, invalid coordinates, etc.), the system falls back to straight line:

```javascript
try {
  const routeCoords = await this.fetchRealRoute(point1, point2);
  if (routeCoords) {
    // Use OSRM route
  } else {
    // Fallback: straight line
  }
} catch (error) {
  console.warn('[RouteManager] OSRM routing failed, using straight line');
  // Fallback: straight line
}
```

### Performance Considerations

1. **Sequential API Calls**: Routes are fetched sequentially (not parallel) to avoid rate limiting
2. **Cache First**: Always check cache before making API call
3. **Minimal Redraws**: Only redraw when necessary (not on every render)

### Troubleshooting

**Problem**: Route crosses water/mountains
- **Solution**: OSRM is working correctly, check if coordinates are correct

**Problem**: Route not updating
- **Solution**: Ensure async/await is used correctly in all calling code

**Problem**: Console shows OSRM errors
- **Solution**: Check network connection, verify coordinates are valid (lat: -90 to 90, lon: -180 to 180)

**Problem**: Slow route rendering
- **Solution**: Cache is working, this is normal for first draw (API latency ~200-500ms per segment)

### Testing Route Template

1. Select "Rota Bazlı" template
2. Add point in Mersin: `36.8121, 34.6415`
3. Add point in Hatay: `36.2081, 36.1604`
4. Route should follow coast road (not cross Mediterranean Sea)
5. Check console for OSRM logs (only if errors occur)

### Important Notes

- **No API Key Required**: OSRM public server is free
- **No Rate Limit**: Reasonable usage is fine
- **Global Coverage**: Works worldwide
- **Cache Not Persistent**: Cleared on page refresh (future: could save to localStorage)
- **Fallback Always Works**: If OSRM fails, straight line is drawn

---

## Route Point Management

### Point Deletion and Renumbering

When a point is deleted from a route template, the system automatically handles:

1. **Route Line Cleanup**: If fewer than 2 points remain, the route line is automatically removed from the map
   - Location: `RouteManager.js:connectAllPoints()`
   - Calls `removeRouteLine()` when `routePoints.length < 2`

2. **Automatic Renumbering**: Remaining points are renumbered sequentially starting from 1
   - Location: `DetailPanel.js:handleDelete()`
   - Updates both data model (`point.number`) and DOM (`.marker-number` span)
   - Ensures sidebar and map markers stay in sync

**Example:**
```javascript
// After deleting point 1 from a 3-point route:
// Before: Points 1, 2, 3
// After:  Points 1, 2 (former points 2 and 3 renumbered)

this.sidebar.points.forEach((p, index) => {
    if (!p.isDrawing) {
        const newNumber = index + 1;
        p.number = newNumber;

        // Update marker display
        if (p.marker && p.marker.getElement()) {
            const markerEl = p.marker.getElement();
            const numberSpan = markerEl.querySelector('.marker-number');
            if (numberSpan) {
                numberSpan.textContent = newNumber;
            }
        }
    }
});
```

### Sidebar Route Metadata

Route template points display additional metadata in the sidebar:
- Distance lines between points (calculated by RouteManager)
- Day information (visit day for each point)
- Duration and timestamp fields

**Critical**: When updating the points list, ensure `isRouteTemplate` parameter is passed to `renderPoints()`:

```javascript
// In SidebarComponent.js:updatePointsList()
const isRouteTemplate = this.data.templateName === 'Rota Bazlı';
pointsContainer.innerHTML = renderPoints(this.points, isRouteTemplate);
```

This ensures route-specific UI elements (distance lines, day badges) are rendered correctly.

### Common Pitfalls

1. **Missing await on async route methods**: Always await `onConnectAllPoints()` and other route methods
2. **Forgetting isRouteTemplate parameter**: Sidebar won't show route metadata without this flag
3. **Not updating marker DOM**: Point number changes must update both data and visual representation

---

## Development Mode

The application supports a development mode that bypasses authentication:

```javascript
// Access via URL parameter
// http://localhost:8000/app.html?dev

// In main.js:
const isDevMode = urlParams.has('dev');
if (!isDevMode) {
    if (!authManager.requireAuth()) {
        throw new Error('Unauthorized');
    }
} else {
    console.log('[App] DEV MODE: Auth check skipped');
    // Runs in IndexedDB-only mode
}
```

**Dev mode characteristics:**
- No authentication required
- No backend API calls
- Data stored locally in IndexedDB only
- Useful for UI development and testing

