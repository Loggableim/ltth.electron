# LTTH Electron - Production Build Guide

This document provides complete instructions for building and distributing the LTTH application as a professional Windows desktop application with auto-update capabilities.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Setup](#development-setup)
3. [Building the Application](#building-the-application)
4. [Code Signing](#code-signing)
5. [Auto-Updates](#auto-updates)
6. [Distribution](#distribution)

---

## Prerequisites

### Required Software

- **Node.js** 18.0.0 or higher (but less than 24.0.0)
- **npm** (comes with Node.js)
- **Windows** (for building Windows installers)

### Required Assets

1. **Application Icon** (`build/icon.ico`)
   - Size: 256x256 pixels (multi-resolution ICO recommended)
   - Format: ICO file
   - Create using: ImageMagick, online converters, or graphic design software
   - Example command with ImageMagick:
     ```bash
     convert icon.png -define icon:auto-resize=256,128,64,48,32,16 build/icon.ico
     ```

2. **Code Signing Certificate** (for production)
   - **EV Code Signing Certificate** recommended for avoiding SmartScreen warnings
   - Can be obtained from: DigiCert, Sectigo, GlobalSign, etc.
   - Store certificate in PFX/P12 format

---

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Run in Development Mode

```bash
# Start the Electron app
npm start

# Or start with development tools
npm run electron:dev
```

The application will:
- Start the Express server on port 3000
- Open the dashboard in an Electron window
- Enable DevTools (in development mode)

---

## Building the Application

### Development Build (No Signing)

Build without packaging for quick testing:

```bash
npm run dist:dir
```

This creates an unpacked directory in `dist/win-unpacked/` for testing.

### Production Build (Windows Installer)

```bash
npm run dist:win
```

This creates:
- `dist/LTTH Setup 1.0.3.exe` - NSIS installer
- Installer is configured for:
  - **perMachine installation** (all users)
  - **Custom installation directory** option
  - **Desktop and Start Menu shortcuts**
  - **License agreement** (from LICENSE.md)

### Build Output

After a successful build, you'll find:
- **Installer:** `dist/LTTH Setup [version].exe`
- **Unpacked app:** `dist/win-unpacked/`
- **Build metadata:** Various YAML files in `dist/`

---

## Code Signing

### Why Code Signing is Critical

**Without code signing:**
- Windows SmartScreen will warn users
- Installer may be flagged as potentially unsafe
- Reduced user trust

**With code signing:**
- Professional, trusted installation experience
- No SmartScreen warnings (especially with EV certificate)
- Required for auto-updates to work properly

### Setting Up Code Signing

#### 1. Obtain a Certificate

Get an **EV Code Signing Certificate** from a trusted CA:
- DigiCert
- Sectigo
- GlobalSign
- Others

#### 2. Export Certificate as PFX/P12

Export your certificate with private key to a `.pfx` or `.p12` file.

#### 3. Set Environment Variables

Before building, set these environment variables:

**Windows (PowerShell):**
```powershell
$env:CSC_LINK = "C:\path\to\certificate.pfx"
$env:CSC_KEY_PASSWORD = "your-certificate-password"
```

**Windows (Command Prompt):**
```cmd
set CSC_LINK=C:\path\to\certificate.pfx
set CSC_KEY_PASSWORD=your-certificate-password
```

**CI/CD (GitHub Actions):**
```yaml
env:
  CSC_LINK: ${{ secrets.WINDOWS_CERTIFICATE }}
  CSC_KEY_PASSWORD: ${{ secrets.WINDOWS_CERTIFICATE_PASSWORD }}
```

#### 4. Build with Signing

```bash
npm run dist:win
```

The installer will now be signed with your certificate.

### Security Best Practices

⚠️ **NEVER commit certificates or passwords to version control!**

- Store certificates securely
- Use environment variables or secure vaults
- In CI/CD, use encrypted secrets
- Rotate certificates before expiration

---

## Auto-Updates

The application includes built-in auto-update functionality using `electron-updater`.

### How It Works

1. **On App Start:** Checks for updates from GitHub Releases
2. **Update Available:** Notifies user via console/UI
3. **Download:** Downloads update in background
4. **Install:** Auto-installs and restarts after 5 seconds

### Publishing Releases for Auto-Update

#### 1. Create a GitHub Release

```bash
# Tag your version
git tag v1.0.4
git push origin v1.0.4
```

#### 2. Build the Installer

```bash
npm run dist:win
```

#### 3. Upload to GitHub Release

1. Go to GitHub → Releases → Create new release
2. Choose the tag (e.g., `v1.0.4`)
3. Upload these files:
   - `LTTH Setup 1.0.4.exe`
   - `latest.yml` (from dist/)
4. Publish the release

#### 4. Users Get Auto-Updates

When users launch the app:
- Checks GitHub for newer version
- Downloads and installs automatically
- Restarts to apply update

### Update Configuration

The auto-updater is configured in `package.json`:

```json
"publish": {
  "provider": "github",
  "owner": "Loggableim",
  "repo": "ltth.electron",
  "releaseType": "release"
}
```

### Testing Auto-Updates

1. Build version 1.0.3
2. Install it
3. Increment version to 1.0.4 in package.json
4. Build version 1.0.4
5. Create GitHub release with v1.0.4
6. Run the 1.0.3 app → it should detect and download 1.0.4

---

## Distribution

### Direct Distribution

Share the installer file directly:
- `LTTH Setup 1.0.3.exe`
- Users run the installer
- Application installs to Program Files
- Auto-updates from GitHub

### GitHub Releases

Recommended for automatic updates:

1. **Build:** `npm run dist:win`
2. **Create Release:** GitHub → Releases → New
3. **Upload:** Installer + latest.yml
4. **Publish:** Release becomes available

### System Requirements

Inform users of minimum requirements:
- **OS:** Windows 10 or later (64-bit)
- **RAM:** 4GB minimum, 8GB recommended
- **Disk:** 500MB free space
- **Network:** Internet connection for TikTok streaming and updates

---

## Installer Features

The NSIS installer includes:

✅ **Custom Installation Directory**
✅ **Per-Machine Installation** (all users)
✅ **Desktop Shortcut** (optional)
✅ **Start Menu Shortcut**
✅ **License Agreement** (MIT License)
✅ **Uninstaller** with clean removal
✅ **Professional branding** with icon

---

## Troubleshooting

### Build Fails

**"icon.ico not found"**
- Create or add icon file to `build/icon.ico`
- Must be valid ICO format

**Native module compilation errors**
- Ensure you have build tools: `npm install --global windows-build-tools`
- Or install Visual Studio Build Tools

### Code Signing Issues

**"Certificate not found"**
- Verify CSC_LINK path is correct
- Ensure certificate is in PFX/P12 format

**"Invalid password"**
- Check CSC_KEY_PASSWORD is correct
- Ensure no extra spaces in environment variable

### Auto-Update Not Working

**Updates not detected**
- Verify GitHub release is published (not draft)
- Check version in package.json is incremented
- Ensure latest.yml is uploaded to release

---

## Security Considerations

### Application Security

✅ **Context Isolation:** Enabled
✅ **Node Integration:** Disabled in renderer
✅ **Preload Script:** Secure IPC bridge
✅ **No remote content:** Loads local server only

### Build Security

⚠️ **Code Signing:** REQUIRED for production
⚠️ **Certificate Storage:** Keep certificates secure
⚠️ **Update Channel:** Uses HTTPS (GitHub)
⚠️ **Signature Verification:** Auto-updater verifies signatures

---

## Additional Resources

- [Electron Builder Documentation](https://www.electron.build/)
- [Electron Security Checklist](https://www.electronjs.org/docs/latest/tutorial/security)
- [NSIS Installer Options](https://www.electron.build/configuration/nsis)
- [Code Signing Guide](https://www.electron.build/code-signing)

---

## Support

For issues or questions:
- **Email:** loggableim@gmail.com
- **GitHub Issues:** https://github.com/Loggableim/ltth.electron/issues

---

**Built with ❤️ using Electron**
