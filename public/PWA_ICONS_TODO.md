# PWA Icons Required

The PWA configuration requires two icon files in the `public/` directory:

1. **icon-192.png** - 192x192 pixels
2. **icon-512.png** - 512x512 pixels

These icons are referenced in `astro.config.mjs` and will be used:
- For the installable PWA app icon
- On the home screen when installed
- In the app switcher

## Temporary Solution
Until proper icons are created, the app will still work as a PWA but won't show icons when installed.

## Creating Icons
You can:
1. Export the existing `favicon.svg` as PNG at 192x192 and 512x512
2. Use a tool like Figma, Photoshop, or GIMP to create PNG versions
3. Use an online SVG to PNG converter

The icons should match your brand/app identity.
