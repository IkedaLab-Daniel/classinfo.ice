# Production Authentication Debug Guide

## How to Debug Authentication Issues on Netlify

### 1. Enable Debug Mode
Add `?debug=true` to your URL:
```
https://your-netlify-site.com/manage?debug=true
```

This will automatically log environment and session storage information to the console.

### 2. Open Browser Console
- **Chrome/Edge**: F12 → Console tab
- **Firefox**: F12 → Console tab  
- **Safari**: Cmd+Option+I → Console tab

### 3. Check Console Logs
Look for these debug sections:
- `🐛 Auth Debug Mode Activated`
- `=== Environment Debug ===`
- `=== SimpleAuth Debug ===`
- `=== Manage.jsx Auth Check ===`

### 4. Common Issues & Solutions

#### Issue: "VITE_ADMIN_PASSWORD exists: false"
**Problem**: Environment variable not set in Netlify
**Solution**: 
1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add `VITE_ADMIN_PASSWORD` with your password value
3. Redeploy the site

#### Issue: "Session storage error"
**Problem**: Browser blocking session storage
**Solution**: Check if site is served over HTTPS and cookies are enabled

#### Issue: "Authentication successful" but still shows auth screen
**Problem**: React state not updating properly
**Solution**: Check for JavaScript errors in console

#### Issue: Environment variable has wrong value
**Problem**: Cached build or incorrect variable
**Solution**: 
1. Clear site cache in Netlify
2. Trigger new deployment
3. Verify environment variable value

### 5. Manual Debug Commands
You can run these in the browser console:

```javascript
// Check environment variables
console.log('VITE_ADMIN_PASSWORD:', import.meta.env.VITE_ADMIN_PASSWORD);

// Check session storage
console.log('Session Auth:', sessionStorage.getItem('adminAuth'));
console.log('Session Time:', sessionStorage.getItem('adminAuthTime'));

// Test session storage
sessionStorage.setItem('test', 'works');
console.log('Session test:', sessionStorage.getItem('test'));

// Force authentication (temporary)
sessionStorage.setItem('adminAuth', 'true');
sessionStorage.setItem('adminAuthTime', Date.now().toString());
location.reload();
```

### 6. Netlify-Specific Checks

#### Build Logs
Check Netlify build logs for:
- Environment variables being loaded
- Build process completing successfully
- No errors during build

#### Deploy Settings
Verify:
- Branch is correct
- Build command is correct
- Environment variables are set at site level (not just deploy level)

### 7. Emergency Access
If completely locked out, you can temporarily bypass by running in console:
```javascript
// EMERGENCY BYPASS - Only for debugging!
sessionStorage.setItem('adminAuth', 'true');
sessionStorage.setItem('adminAuthTime', Date.now().toString());
window.location.reload();
```

**Note**: This is only for debugging. The proper fix is to resolve the environment variable issue.

### 8. Remove Debug Logs
After fixing, remove debug logs by:
1. Removing `?debug=true` from URL
2. Or updating the code to disable debug mode in production
