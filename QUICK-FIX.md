# Quick Fix for "Failed to load chunk" Error

## ⚡ IMMEDIATE SOLUTION

### Step 1: Stop Dev Server
Press `Ctrl + C` in your terminal to stop the development server.

### Step 2: Clean Build
```bash
# Windows PowerShell
Remove-Item -Recurse -Force .next
npm run build

# Mac/Linux
rm -rf .next
npm run build
```

### Step 3: Restart Dev Server
```bash
npm run dev
```

### Step 4: Hard Refresh Browser
- **Windows/Linux:** `Ctrl + Shift + R`
- **Mac:** `Cmd + Shift + R`

---

## 🔍 WHY THIS HAPPENS

The "Failed to load chunk" error occurs when:

1. **Stale dev server cache** — Old chunks cached in memory
2. **Browser cache mismatch** — Browser has old chunks
3. **Hot reload corruption** — Dev server state corrupted
4. **Build/dev mismatch** — Running old build with new code

---

## ✅ PERMANENT FIX

### Option 1: Always Clean Before Dev (Recommended)

Create a script in `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:clean": "rm -rf .next && next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

Then use:
```bash
npm run dev:clean
```

### Option 2: Use Production Build

Instead of `npm run dev`, use:

```bash
npm run build
npm run start
```

This serves the production build (more stable, no hot reload issues).

---

## 🚨 IF ERROR PERSISTS

### Nuclear Option (Guaranteed Fix)

```bash
# 1. Stop dev server (Ctrl+C)

# 2. Kill all node processes
# Windows:
taskkill /F /IM node.exe

# Mac/Linux:
killall node

# 3. Clean everything
rm -rf .next node_modules/.cache

# 4. Rebuild
npm run build

# 5. Start fresh
npm run dev

# 6. Hard refresh browser (Ctrl+Shift+R)
```

---

## 🎯 PREVENTION

### Best Practices

1. **Always stop dev server before pulling code**
   ```bash
   Ctrl+C  # Stop server
   git pull
   npm run dev  # Restart
   ```

2. **Clean build after major changes**
   ```bash
   rm -rf .next
   npm run build
   npm run dev
   ```

3. **Use production build for testing**
   ```bash
   npm run build
   npm run start
   ```

4. **Clear browser cache regularly**
   - DevTools (F12) → Application → Clear storage

---

## 📊 CURRENT STATUS

**Build:** ✅ Successful (zero errors)  
**TypeScript:** ✅ No errors  
**Launch Intro:** ✅ Properly integrated  

**The code is correct. The issue is dev server cache.**

---

## 🔧 ALTERNATIVE: Use Production Mode

If dev server keeps having issues, use production mode:

```bash
# Build once
npm run build

# Run production server
npm run start

# Open http://localhost:3000
```

**Advantages:**
- ✅ No hot reload issues
- ✅ No chunk loading errors
- ✅ Faster performance
- ✅ Matches production exactly

**Disadvantages:**
- ❌ No hot reload (must rebuild after changes)
- ❌ Slower development cycle

---

## 💡 QUICK COMMANDS

### Clean and Restart (Copy-Paste)

**Windows PowerShell:**
```powershell
# Stop server first (Ctrl+C), then:
Remove-Item -Recurse -Force .next; npm run build; npm run dev
```

**Mac/Linux:**
```bash
# Stop server first (Ctrl+C), then:
rm -rf .next && npm run build && npm run dev
```

### Production Mode (Copy-Paste)

```bash
# Stop server first (Ctrl+C), then:
npm run build && npm run start
```

---

## ✅ VERIFICATION

After applying fix, verify:

1. **Dev server starts without errors**
   ```
   ✓ Ready in 2.3s
   ○ Local: http://localhost:3000
   ```

2. **Browser loads without chunk errors**
   - No "Failed to load chunk" message
   - App loads normally

3. **Launch intro appears (if onboarding complete)**
   - 2-second cinematic intro
   - Shows academic goal
   - Transitions to dashboard

---

## 🆘 STILL NOT WORKING?

### Check These:

1. **Port conflict**
   ```bash
   # Kill process on port 3000
   # Windows:
   netstat -ano | findstr :3000
   taskkill /PID [PID] /F
   
   # Mac/Linux:
   lsof -ti:3000 | xargs kill -9
   ```

2. **Node version**
   ```bash
   node --version
   # Should be v18+ or v20+
   ```

3. **NPM cache**
   ```bash
   npm cache clean --force
   npm install
   npm run build
   ```

4. **Different browser**
   - Try Chrome, Firefox, Edge
   - Try incognito/private mode

---

**Last Updated:** May 26, 2026  
**Status:** Verified working after clean build

---

**TL;DR:**
1. Stop dev server (Ctrl+C)
2. Run: `rm -rf .next && npm run build && npm run dev`
3. Hard refresh browser (Ctrl+Shift+R)
4. Done! ✅
