# Sidus Assets Directory

This directory contains all static assets used in the Sidus application, organized by type for better maintainability.

## Directory Structure

```
public/assets/
├── fonts/           # Custom fonts (Aleo family)
│   ├── Aleo-Regular.ttf
│   ├── Aleo-Bold.ttf
│   └── Aleo-Italic.ttf
├── images/          # Application images and graphics
│   ├── sidus_favicon.png
│   └── sidus_logo.png
└── icons/           # Icon files and SVG assets
    └── (reserved for future icons)
```

## Usage Guidelines

### Fonts
- **Aleo Regular**: Primary body text (400 weight)
- **Aleo Bold**: Headings and emphasis (700 weight)  
- **Aleo Italic**: Subtle emphasis and quotes (400 weight, italic)

Access fonts via CSS: `font-family: 'Aleo', serif;`

### Images
- **sidus_logo.png**: Main application logo
- **sidus_favicon.png**: Favicon source image

Access images via: `/assets/images/filename.png`

### Icons
- Reserved directory for future SVG icons and icon assets
- Recommended: Use consistent sizing and follow design system

## Adding New Assets

1. **Images**: Place in `/public/assets/images/`
   - Use descriptive names
   - Optimize for web (consider WebP format for better compression)
   - Include @2x versions for high-DPI displays when needed

2. **Fonts**: Place in `/public/assets/fonts/`
   - Add corresponding @font-face declarations in `app/globals.css`
   - Include multiple weights/styles as needed

3. **Icons**: Place in `/public/assets/icons/`
   - Prefer SVG format for scalability
   - Use consistent naming convention
   - Consider creating an icon component library

## Notes

- All assets are publicly accessible via `/assets/...` URLs
- Font files are referenced in `app/globals.css` with the `/assets/fonts/` path
- The main favicon is copied to `/public/favicon.ico` for Next.js compatibility 