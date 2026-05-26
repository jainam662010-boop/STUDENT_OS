// ─────────────────────────────────────────────────────────
//  Student OS — PWA Icon Generator
//  Generates missing PNG icons from SVG source
//  Run: node scripts/generate-icons.js
// ─────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

// This script provides instructions for generating icons
// Since we can't run sharp/canvas in this environment, we provide manual instructions

const INSTRUCTIONS = `
PWA ICON GENERATION INSTRUCTIONS
=================================

Student OS requires the following PNG icons for full PWA support:

REQUIRED ICONS:
1. icon-192x192.png  — 192x192px PNG (standard PWA icon)
2. icon-512x512.png  — 512x512px PNG (high-res PWA icon)

CURRENT ASSETS:
✓ icon.svg           — Source SVG (exists)
✓ icon-512.svg       — Large SVG (exists)
✓ apple-icon.png     — 180x180px (exists)
✓ icon-dark-32x32.png — 32x32px favicon (exists)
✓ icon-light-32x32.png — 32x32px favicon (exists)

GENERATION OPTIONS:

Option 1: Using Online Tools (Easiest)
---------------------------------------
1. Go to https://realfavicongenerator.net/
2. Upload public/icon.svg
3. Configure:
   - Android Chrome: Generate 192x192 and 512x512
   - iOS: Use existing apple-icon.png
   - Windows: Skip (not needed)
4. Download and extract to public/

Option 2: Using ImageMagick (Command Line)
-------------------------------------------
Install ImageMagick, then run:

  convert public/icon.svg -resize 192x192 public/icon-192x192.png
  convert public/icon.svg -resize 512x512 public/icon-512x512.png

Option 3: Using Node.js Sharp (Automated)
------------------------------------------
Install sharp:
  npm install --save-dev sharp

Then create and run this script:

  const sharp = require('sharp')
  const fs = require('fs')
  
  async function generateIcons() {
    const svg = fs.readFileSync('public/icon.svg')
    
    await sharp(svg)
      .resize(192, 192)
      .png()
      .toFile('public/icon-192x192.png')
    
    await sharp(svg)
      .resize(512, 512)
      .png()
      .toFile('public/icon-512x512.png')
    
    console.log('Icons generated!')
  }
  
  generateIcons()

Option 4: Using Figma/Sketch/Illustrator
-----------------------------------------
1. Open public/icon.svg in your design tool
2. Export as PNG:
   - 192x192px → icon-192x192.png
   - 512x512px → icon-512x512.png
3. Save to public/ directory

MASKABLE ICONS (Optional but Recommended):
-------------------------------------------
For better Android adaptive icon support, create maskable versions:
- Add 20% padding around the icon
- Ensure important content is in the "safe zone" (80% center)
- Export as icon-192x192-maskable.png and icon-512x512-maskable.png

Then update manifest.json:
  {
    "src": "/icon-192x192-maskable.png",
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "maskable"
  }

VERIFICATION:
-------------
After generating icons, verify:
1. Files exist in public/ directory
2. File sizes are reasonable (< 50KB for 192px, < 200KB for 512px)
3. Icons are not distorted (check aspect ratio)
4. Run Lighthouse PWA audit to confirm

CURRENT STATUS:
---------------
`

// Check which icons exist
const publicDir = path.join(__dirname, '..', 'public')
const requiredIcons = [
  'icon-192x192.png',
  'icon-512x512.png',
]

const existingIcons = []
const missingIcons = []

requiredIcons.forEach((icon) => {
  const iconPath = path.join(publicDir, icon)
  if (fs.existsSync(iconPath)) {
    existingIcons.push(icon)
  } else {
    missingIcons.push(icon)
  }
})

console.log(INSTRUCTIONS)

if (existingIcons.length > 0) {
  console.log('✓ EXISTING ICONS:')
  existingIcons.forEach((icon) => {
    const stats = fs.statSync(path.join(publicDir, icon))
    console.log(`  - ${icon} (${(stats.size / 1024).toFixed(1)} KB)`)
  })
  console.log('')
}

if (missingIcons.length > 0) {
  console.log('✗ MISSING ICONS:')
  missingIcons.forEach((icon) => {
    console.log(`  - ${icon}`)
  })
  console.log('')
  console.log('ACTION REQUIRED: Generate the missing icons using one of the options above.')
  process.exit(1)
} else {
  console.log('✓ ALL REQUIRED ICONS EXIST!')
  console.log('')
  console.log('Run Lighthouse PWA audit to verify icon quality.')
  process.exit(0)
}
