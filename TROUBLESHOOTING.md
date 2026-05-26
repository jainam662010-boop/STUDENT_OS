# Student OS — Troubleshooting Guide

## Common Issues & Solutions

---

## 🔴 "Failed to load chunk" Error

### Symptoms
```
Something went wrong
Student OS encountered an unexpected error.
Failed to load chunk /_next/static/chunks/[hash].js from module [number]
```

### Causes
1. **Stale build cache** — Old build artifacts conflicting with new code
2. **Browser cache** — Browser serving old chunks
3. **Hot reload issue** — Development server cache corruption
4. **Build mismatch** — Running old build with new code

### Solutions

#### Solution 1: Clean Build (Recommended)
```bash
# Delete build directory
rm -rf .next

# Rebuild
npm run build

# Restart dev server
npm run dev
```

**Windows PowerShell:**
```powershell
Remove-Item -Recurse -Force .next
npm run build
npm run dev
```

#### Solution 2: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
4. Or: Ctrl+Shift+Delete → Clear cache

#### Solution 3: Clear Node Modules (Nuclear Option)
```bash
# Delete node_modules and lock files
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Rebuild
npm run build
```

#### Solution 4: Check for Syntax Errors
```bash
# Run TypeScript check
npm run build

# Look for compilation errors
# Fix any TypeScript errors before running dev server
```

---

## 🟡 Launch Intro Not Appearing

### Symptoms
- App loads but launch intro doesn't show
- Goes straight to dashboard

### Causes
1. **Onboarding not complete** — User hasn't finished onboarding
2. **Hydration not complete** — State not loaded from localStorage
3. **State stuck** — `showLaunchIntro` not triggering

### Solutions

#### Check Onboarding Status
1. Open DevTools Console (F12)
2. Run:
```javascript
JSON.parse(localStorage.getItem('student-os-storage-v3')).state.onboardingComplete
// Should return: true
```

#### Force Reset Onboarding
1. Open Settings
2. Click "Reset onboarding"
3. Complete onboarding again
4. Launch intro should appear on next start

#### Clear All Data (Nuclear Option)
1. Open Settings
2. Click "Clear all data"
3. Confirm
4. Complete onboarding
5. Launch intro should appear

---

## 🟡 Launch Intro Appears Twice

### Symptoms
- Intro plays, then plays again immediately
- Double animation

### Causes
1. **Multiple render cycles** — State triggering multiple times
2. **Effect dependency issue** — useEffect running twice

### Solutions

#### Check Console for Warnings
1. Open DevTools Console
2. Look for React warnings about:
   - Missing dependencies
   - Infinite loops
   - Double renders

#### Temporary Workaround
1. Skip the intro (tap/click/keyboard)
2. Refresh the page
3. Should only appear once

#### Permanent Fix
- This should be fixed in the latest version
- If persists, report as bug with console logs

---

## 🟡 Animations Are Laggy

### Symptoms
- Intro animation stutters
- Progress ring doesn't fill smoothly
- Transitions are choppy

### Causes
1. **Low-end device** — Insufficient GPU/CPU
2. **Too many browser tabs** — Resource contention
3. **Battery saver mode** — Performance throttling
4. **Browser performance throttling** — Background tab

### Solutions

#### Enable Reduced Motion
1. Open Settings
2. Scroll to "Focus" section
3. Toggle "Reduced motion" to ON
4. Launch intro will be faster and simpler

#### Close Other Tabs
- Close unnecessary browser tabs
- Free up system resources

#### Disable Browser Extensions
- Some extensions can slow down animations
- Try in incognito/private mode

#### Check System Performance
```bash
# Check CPU usage
# Windows: Task Manager (Ctrl+Shift+Esc)
# Mac: Activity Monitor
# Linux: htop or top
```

---

## 🟡 Skip Button Doesn't Work

### Symptoms
- Tapping/clicking doesn't skip intro
- Keyboard shortcuts don't work
- Stuck on intro screen

### Causes
1. **Too early** — Skip not enabled yet (800ms delay)
2. **Event handler not attached** — JavaScript error
3. **Browser focus issue** — Window not focused

### Solutions

#### Wait 800ms
- Skip becomes available after 800ms
- Look for "Tap to skip" hint at bottom
- If hint appears, skip should work

#### Try Keyboard
- Press Escape
- Press Space
- Press Enter

#### Check Console for Errors
1. Open DevTools Console (F12)
2. Look for JavaScript errors
3. If errors present, refresh page

#### Force Skip (Emergency)
1. Open DevTools Console (F12)
2. Run:
```javascript
sessionStorage.setItem('skip-intro', 'true')
location.reload()
```

---

## 🟡 Goal Not Displaying Correctly

### Symptoms
- Goal shows as "Building [Name]'s Future" instead of actual goal
- Goal is truncated incorrectly
- Goal is empty

### Causes
1. **Goal not set** — User skipped goal selection
2. **Goal not saved** — localStorage issue
3. **Goal too long** — Truncation logic

### Solutions

#### Check Goal in Storage
1. Open DevTools Console (F12)
2. Run:
```javascript
JSON.parse(localStorage.getItem('student-os-storage-v3')).state.academicGoal
// Should return your goal string
```

#### Set Goal in Settings
1. Open Settings
2. Scroll to "Focus" section
3. Click "Academic goal"
4. Enter your goal
5. Save

#### Re-run Onboarding
1. Open Settings
2. Click "Reset onboarding"
3. Complete onboarding
4. Set goal when prompted

---

## 🟢 Hydration Mismatch Warning

### Symptoms
```
Warning: Text content did not match. Server: "..." Client: "..."
Warning: Hydration failed because the initial UI does not match...
```

### Causes
1. **Date/time rendering** — Server vs client time difference
2. **Random values** — Non-deterministic rendering
3. **localStorage access** — Server can't access localStorage

### Solutions

#### This is Normal (Usually)
- Small hydration warnings are common in Next.js
- App should still work correctly
- Only concern if app breaks

#### Check for Errors
- If app works fine, ignore warning
- If app breaks, check console for actual errors

#### Report if Persistent
- If warning appears every time
- And causes visual glitches
- Report with console logs

---

## 🔴 App Won't Load at All

### Symptoms
- Blank white screen
- "Something went wrong" error
- Infinite loading

### Solutions

#### Check Browser Console
1. Open DevTools (F12)
2. Look for red errors
3. Note the error message

#### Clear All Data
1. Open DevTools Console
2. Run:
```javascript
localStorage.clear()
sessionStorage.clear()
location.reload()
```

#### Try Different Browser
- Test in Chrome, Firefox, Safari, Edge
- If works in one browser, issue is browser-specific

#### Check Network Tab
1. Open DevTools → Network tab
2. Refresh page
3. Look for failed requests (red)
4. Check if chunks are loading

#### Disable Service Worker
1. Open DevTools → Application tab
2. Click "Service Workers"
3. Click "Unregister"
4. Refresh page

---

## 🟡 PWA Installation Issues

### Symptoms
- "Install App" prompt doesn't appear
- Installation fails
- App doesn't work offline

### Solutions

#### Check PWA Requirements
1. Open DevTools → Application tab
2. Click "Manifest"
3. Verify all icons load
4. Check for errors

#### Check Service Worker
1. Open DevTools → Application tab
2. Click "Service Workers"
3. Verify service worker is registered
4. Check for errors

#### Force Install Prompt
1. Open DevTools → Application tab
2. Click "Manifest"
3. Click "Install" button (if available)

#### Check Lighthouse
1. Open DevTools → Lighthouse tab
2. Run PWA audit
3. Fix any issues reported

---

## 🟡 Timer Doesn't Persist After Refresh

### Symptoms
- Start timer, refresh page
- Timer resets to 0
- Lost progress

### Causes
1. **localStorage quota exceeded** — Can't save state
2. **Browser privacy mode** — localStorage disabled
3. **Corrupted state** — Invalid timer state

### Solutions

#### Check Storage Quota
1. Open DevTools Console
2. Run:
```javascript
navigator.storage.estimate().then(e => 
  console.log(`Used: ${e.usage}, Quota: ${e.quota}`)
)
```

#### Clear Old Data
1. Open Settings
2. Click "Export data" (backup first!)
3. Click "Clear all data"
4. Re-import if needed

#### Check Privacy Mode
- Incognito/Private mode may disable localStorage
- Try in normal browser window

---

## 🟡 Notifications Don't Work

### Symptoms
- No notification when focus session completes
- Permission request doesn't appear
- Notifications blocked

### Solutions

#### Check Permission
1. Open Settings
2. Look for "Notifications" section
3. Check permission status

#### Grant Permission Manually
**Chrome:**
1. Click lock icon in address bar
2. Click "Site settings"
3. Find "Notifications"
4. Change to "Allow"

**Firefox:**
1. Click lock icon in address bar
2. Click "More information"
3. Click "Permissions" tab
4. Find "Notifications"
5. Change to "Allow"

#### Check Browser Settings
- Some browsers block all notifications by default
- Check browser settings → Notifications

---

## 🔧 Development Issues

### Hot Reload Not Working

```bash
# Kill all node processes
# Windows:
taskkill /F /IM node.exe

# Mac/Linux:
killall node

# Restart dev server
npm run dev
```

### Port Already in Use

```bash
# Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9

# Or use different port:
PORT=3001 npm run dev
```

### TypeScript Errors

```bash
# Check for errors
npm run build

# If errors persist, try:
rm -rf node_modules .next
npm install
npm run build
```

---

## 📊 Performance Issues

### App Feels Slow

1. **Check browser extensions** — Disable and test
2. **Check system resources** — Close other apps
3. **Enable reduced motion** — Settings → Reduced motion
4. **Clear browser cache** — Hard refresh
5. **Update browser** — Use latest version

### High Memory Usage

1. **Close other tabs** — Free up RAM
2. **Restart browser** — Clear memory leaks
3. **Check for memory leaks** — DevTools → Memory tab
4. **Report if persistent** — With memory snapshot

---

## 🆘 Emergency Recovery

### Nuclear Option: Complete Reset

```bash
# 1. Backup data (if possible)
# Open Settings → Export data

# 2. Clear everything
localStorage.clear()
sessionStorage.clear()

# 3. Unregister service worker
# DevTools → Application → Service Workers → Unregister

# 4. Clear cache
# DevTools → Application → Storage → Clear site data

# 5. Close all tabs

# 6. Reopen app

# 7. Complete onboarding
```

---

## 📞 Getting Help

### Before Reporting Issues

1. **Check this guide** — Solution might be here
2. **Check console** — Note any error messages
3. **Try solutions** — Attempt fixes above
4. **Gather info** — Browser, OS, error messages

### What to Include in Bug Reports

1. **Error message** — Exact text from console
2. **Steps to reproduce** — What you did before error
3. **Browser & OS** — Chrome 120 on Windows 11, etc.
4. **Screenshots** — If visual issue
5. **Console logs** — Copy from DevTools

### Where to Report

- GitHub Issues (if available)
- Developer contact (check Settings → Creator)
- Include all info from above

---

## ✅ Prevention Tips

### Keep App Healthy

1. **Regular exports** — Backup data weekly
2. **Clear old data** — Use cleanup features
3. **Update browser** — Keep browser current
4. **Monitor storage** — Watch for quota warnings
5. **Report issues early** — Don't wait for crashes

### Best Practices

1. **Complete sessions** — Don't force-close during focus
2. **Sync regularly** — Export data periodically
3. **Use skip wisely** — Don't spam skip button
4. **Respect limits** — Don't create 1000s of tasks
5. **Update app** — Refresh to get latest version

---

**Last Updated:** May 26, 2026  
**Version:** 1.0.0  
**Status:** Production

---

**Need more help?** Check Settings → Creator for contact information.
