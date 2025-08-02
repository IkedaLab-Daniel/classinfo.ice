# Netlify SPA Routing Fix Guide

## Problem
Getting "Page not found" error when visiting `https://dailyclass.netlify.app/manage` directly or refreshing the page.

## Root Cause
Netlify tries to find a physical file at `/manage` path, but React Router handles routing client-side.

## Solutions Applied

### 1. _redirects File (✅ Applied)
Located: `client/public/_redirects`
```
/*    /index.html   200
```

### 2. netlify.toml File (✅ Applied)
Located: `client/netlify.toml`
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Troubleshooting Steps

### Step 1: Verify Deployment
1. Check Netlify deploy logs for errors
2. Ensure `_redirects` file is copied to output directory
3. Confirm `netlify.toml` is in project root

### Step 2: Check Build Output
In Netlify build logs, look for:
```
✓ Built in [time]
✓ _redirects file copied
✓ dist/ directory created
```

### Step 3: Manual Test
After deployment, test these URLs:
- ✅ `https://dailyclass.netlify.app/` (should work)
- ❌ `https://dailyclass.netlify.app/manage` (currently broken)
- ❌ `https://dailyclass.netlify.app/nonexistent` (should redirect to home)

### Step 4: Netlify Deploy Settings
Verify in Netlify dashboard:
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Branch**: `main` (or your default branch)

### Step 5: Cache Issues
If still not working:
1. Clear Netlify cache: Dashboard → Site → Deploys → Clear cache and deploy site
2. Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

## Alternative Solutions

### If _redirects doesn't work, try netlify.toml only:
Remove `public/_redirects` and rely on `netlify.toml`

### If both don't work, check Vite config:
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  base: '/', // Ensure base is set to root
  build: {
    outDir: 'dist',
  }
})
```

## Common Issues

### Issue 1: Wrong publish directory
**Problem**: Netlify looking in wrong folder
**Solution**: Set publish directory to `dist` (not `build`)

### Issue 2: _redirects not copied
**Problem**: File not in public folder
**Solution**: Ensure `_redirects` is in `client/public/` folder

### Issue 3: Multiple redirects files
**Problem**: Conflicting configuration
**Solution**: Choose either `_redirects` OR `netlify.toml`, not both

### Issue 4: Base path issues
**Problem**: App expects different base path
**Solution**: Set `base: '/'` in vite.config.js

## Testing Locally
Test the built app locally:
```bash
npm run build
npm run preview
```

Then try visiting `/manage` directly to see if it works locally.

## Immediate Next Steps
1. Trigger new Netlify deployment
2. Check deploy logs for any errors
3. Test `/manage` route after deployment
4. If still failing, check Netlify function logs
