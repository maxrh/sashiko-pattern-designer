# Testing Offline Mode - Quick Guide

## Why Production Build is Needed

**Dev mode limitations:**
- Service worker may not fully activate
- Hot module reload interferes with caching
- Some PWA features don't work in dev mode

**Production build (`npm run preview`):**
- Full service worker activation
- Complete offline functionality
- True PWA behavior

## Testing Steps

### 1. Build and Preview Production Version
```bash
npm run build
npm run preview
```
App runs at: http://localhost:4321

### 2. First Visit (Cache Assets)
1. Open http://localhost:4321 in browser
2. Open DevTools (F12)
3. Go to **Application** tab
4. Check **Service Workers** - should show `sw.js` installed and activated
5. Check **Cache Storage** - should show multiple caches:
   - `workbox-precache-v2-...` (static assets)
   - `pages-cache` (HTML pages)
   - `static-assets-cache` (JS/CSS/images)
   - Font caches

### 3. Test Offline Mode
**Option A - DevTools Network Tab:**
1. Go to **Network** tab
2. Select **"Offline"** from throttling dropdown (top)
3. Refresh page (F5 or Ctrl+R)
4. ✅ Page should load instantly from cache
5. ✅ All functionality should work (drawing, saving, etc.)
6. ✅ Should see "Working offline" indicator

**Option B - DevTools Application Tab:**
1. Go to **Application** tab
2. Find **Service Workers** section
3. Check the **"Offline"** checkbox
4. Refresh page
5. ✅ Should load from cache

**Option C - Disable Network:**
1. Disconnect WiFi or unplug ethernet
2. Refresh page
3. ✅ Should load from cache

### 4. Test Online Detection
1. Switch back to "Online" in Network tab (or reconnect)
2. ✅ Should see "Back online" indicator (green, auto-hides after 3s)
3. Refresh page
4. ✅ Should update cache in background

### 5. Verify Pattern Data Persists
1. Draw some patterns while online
2. Go offline (DevTools Network → Offline)
3. Refresh page
4. ✅ Patterns should still be there (IndexedDB)
5. Draw more patterns
6. ✅ Can save patterns while offline
7. Go back online
8. ✅ Everything still works, data persists

## Expected Behavior

### First Load (Online)
- Downloads all assets
- Caches everything
- Service worker activates
- IndexedDB initialized

### Second Load (Online)
- Loads from cache (instant)
- Service worker checks for updates in background
- Updates cache if new version available

### Offline Load
- Loads entirely from cache (instant)
- No network requests
- Shows "Working offline" indicator
- Full functionality available

### Slow Connection
- Uses cached version (instant)
- No waiting for slow network
- Updates cache in background when possible

## Troubleshooting

### "No Internet Connection" Error in Browser
**Cause:** Service worker not activated yet
**Fix:** 
1. Load page once while online
2. Wait for service worker to install (check DevTools → Application → Service Workers)
3. Then test offline mode

### Service Worker Not Installing
**Cause:** Using dev mode (`npm run dev`)
**Fix:** Use production preview (`npm run build` then `npm run preview`)

### Old Cache Showing Outdated Content
**Cause:** Service worker using old cached version
**Fix:**
1. DevTools → Application → Service Workers
2. Click "Unregister" to remove old worker
3. DevTools → Application → Cache Storage
4. Right-click each cache → Delete
5. Refresh page to re-cache fresh content

### Offline Indicator Not Showing
**Cause:** Component may not be imported
**Check:** 
- `OfflineIndicator.jsx` exists in `src/components/`
- Imported in `PatternDesigner.jsx`
- Component rendered in JSX (should be at bottom)

## Dev Mode vs Production

| Feature | Dev Mode | Production |
|---------|----------|------------|
| Service Worker | Partial | ✅ Full |
| Offline Mode | ⚠️ Limited | ✅ Complete |
| Cache Strategy | Basic | ✅ Optimized |
| Hot Reload | ✅ Yes | ❌ No |
| Testing PWA | ⚠️ Not Recommended | ✅ Recommended |

## Production Deployment (Cloudflare Pages)

Once tested locally:
```bash
npm run build
# Deploy ./dist/ folder to Cloudflare Pages
```

Cloudflare automatically:
- Serves over HTTPS (required for PWA)
- Delivers service worker
- Enables offline functionality
- No special configuration needed
