# PWA Icons Required for Play Store Release

## ⚠️ CRITICAL: Missing Icons

The following PNG icons are **REQUIRED** for PWA installation and Play Store submission:

### Required Files

1. **`public/icon-192x192.png`** (192×192px)
   - Standard PWA icon
   - Used for Android home screen
   - Must be PNG format
   - Recommended: < 50KB file size

2. **`public/icon-512x512.png`** (512×512px)
   - High-resolution PWA icon
   - Used for splash screens
   - Must be PNG format
   - Recommended: < 200KB file size

### Quick Generation (Choose One Method)

#### Method 1: Online Tool (Fastest)
1. Visit: https://realfavicongenerator.net/
2. Upload `public/icon.svg`
3. Download generated icons
4. Place in `public/` directory

#### Method 2: ImageMagick (Command Line)
```bash
# Install ImageMagick first
convert public/icon.svg -resize 192x192 public/icon-192x192.png
convert public/icon.svg -resize 512x512 public/icon-512x512.png
```

#### Method 3: Node.js Sharp (Automated)
```bash
npm install --save-dev sharp
node scripts/generate-icons-sharp.js
```

Create `scripts/generate-icons-sharp.js`:
```javascript
const sharp = require('sharp')
const fs = require('fs')

async function generate() {
  const svg = fs.readFileSync('public/icon.svg')
  
  await sharp(svg).resize(192, 192).png().toFile('public/icon-192x192.png')
  await sharp(svg).resize(512, 512).png().toFile('public/icon-512x512.png')
  
  console.log('✓ Icons generated!')
}

generate().catch(console.error)
```

#### Method 4: Design Tool Export
1. Open `public/icon.svg` in Figma/Sketch/Illustrator
2. Export as PNG at 192×192px and 512×512px
3. Save to `public/` directory

### Verification Checklist

After generating icons:

- [ ] `public/icon-192x192.png` exists
- [ ] `public/icon-512x512.png` exists
- [ ] Both files are PNG format
- [ ] Icons are not distorted (square aspect ratio)
- [ ] File sizes are reasonable (< 50KB and < 200KB)
- [ ] Run `npm run build` successfully
- [ ] Test PWA installation on Android device
- [ ] Run Lighthouse PWA audit (should score 100)

### Manifest Configuration

The `public/manifest.json` already references these icons:

```json
{
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### Optional: Maskable Icons (Recommended)

For better Android adaptive icon support:

1. Add 20% padding around icon content
2. Ensure safe zone (center 80%) contains all important elements
3. Export as separate maskable versions
4. Update manifest with `"purpose": "maskable"` entries

### Screenshots (Also Required for Play Store)

Create screenshots for the install prompt:

1. **`public/screenshots/dashboard.png`** (1080×1920px)
   - Mobile screenshot of dashboard view
   - Portrait orientation

2. **`public/screenshots/tasks.png`** (1080×1920px)
   - Mobile screenshot of tasks view

3. **`public/screenshots/focus.png`** (1080×1920px)
   - Mobile screenshot of focus mode

**How to capture:**
1. Open app in Chrome DevTools mobile view (360×800)
2. Scale to 1080×1920 for export
3. Use browser screenshot tool or design tool
4. Save as PNG in `public/screenshots/`

### Testing PWA Installation

After generating icons:

```bash
# 1. Build production version
npm run build

# 2. Serve locally
npx serve@latest out

# 3. Open in Chrome
# 4. Check DevTools > Application > Manifest
# 5. Verify all icons load correctly
# 6. Test "Install App" prompt
```

### Lighthouse PWA Audit

Run Lighthouse to verify:

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000 --view --preset=desktop

# Check PWA score (should be 100)
```

### Play Store Requirements

For TWA (Trusted Web Activity) submission:

- ✓ All icons present (192px, 512px)
- ✓ Screenshots (3 minimum, portrait)
- ✓ Manifest complete
- ✓ Service worker functional
- ✓ HTTPS (production only)
- ✓ Offline functionality
- ✓ Install prompt working

---

**Status:** ⚠️ **BLOCKING** — Icons must be generated before Play Store submission

**Priority:** 🔴 **CRITICAL**

**Estimated Time:** 10-15 minutes

**Next Steps:**
1. Choose generation method above
2. Generate icons
3. Verify with Lighthouse
4. Test installation on Android device
5. Proceed with Play Store submission
