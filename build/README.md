# Icon Placeholder

This directory should contain the application icon:

- **icon.ico** (256x256 pixels) - Windows installer icon

## Requirements for Production

For a production build, you need to provide:

1. **icon.ico** - Windows icon file (256x256 or multi-resolution ICO)
   - Should be a professional-looking icon representing your application
   - Can be created from PNG using online tools or image editors

## Creating an Icon

### Online Tools
- https://convertico.com/
- https://icoconvert.com/
- https://cloudconvert.com/png-to-ico

### Using ImageMagick
```bash
# Create multi-resolution ICO from PNG
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

### Using GIMP
1. Create/open image at 256x256
2. Export As → Choose .ico format
3. Select multiple sizes when prompted

## Temporary Development

For development without an icon:
- electron-builder may use a default icon
- Or you can create a simple placeholder icon using online tools

## Icon Guidelines

- Use a square image (1:1 aspect ratio)
- Recommended: 256x256 pixels or larger
- Avoid complex details (icons are viewed small)
- Use bold, recognizable shapes
- Consider transparency for rounded corners
- Test at different sizes (16x16 to 256x256)

