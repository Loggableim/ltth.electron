# LTTH Electron - Schnellstart Anleitung (Quick Start Guide)

## 🎯 Überblick (Overview)

Deine LTTH-Anwendung wurde erfolgreich in eine professionelle Electron Desktop-Anwendung umgewandelt mit:

✅ **Electron Desktop-App** - Native Windows-Anwendung
✅ **NSIS Installer** - Professioneller Setup.exe Installer  
✅ **Auto-Update** - Automatische Updates via GitHub Releases
✅ **Sicherheit** - Context Isolation & IPC Bridge
✅ **Persistenz** - Fensterposition & -größe werden gespeichert

---

## 🚀 Entwicklung (Development)

### Electron-App starten

```bash
# Electron-App im Entwicklungsmodus starten
npm start

# Mit DevTools (für Debugging)
npm run electron:dev

# Nur den Server starten (ohne Electron)
npm run start:server
```

Die App startet den Express-Server automatisch und öffnet das Dashboard in einem Electron-Fenster.

---

## 📦 Installer Erstellen (Building Installer)

### Voraussetzungen (Prerequisites)

1. **Icon erstellen** (falls noch nicht vorhanden):
   - Datei: `build/icon.ico`
   - Größe: 256x256 Pixel (ICO-Format)
   - Siehe: `build/README.md` für Anleitung

2. **Code Signing Zertifikat** (optional, aber empfohlen):
   - EV Code Signing Certificate für Windows
   - Format: PFX/P12
   - Anbieter: DigiCert, Sectigo, GlobalSign

### Installer bauen

```bash
# CSS bauen
npm run build:css

# Windows Installer erstellen
npm run dist:win
```

**Output:** `dist/LTTH Setup 1.0.3.exe`

### Mit Code Signing (Production)

```bash
# Umgebungsvariablen setzen
set CSC_LINK=C:\path\to\certificate.pfx
set CSC_KEY_PASSWORD=your-password

# Installer bauen
npm run dist:win
```

---

## 🔐 Code Signing Setup

### Warum Code Signing?

**Ohne Signierung:**
- ❌ Windows SmartScreen Warnung
- ❌ "Unbekannter Herausgeber"
- ❌ Benutzer müssen Warnung ignorieren

**Mit Signierung:**
- ✅ Vertrauenswürdiger Installer
- ✅ Keine SmartScreen Warnungen
- ✅ Professional & Sicher

### Zertifikat besorgen

1. **EV Code Signing Certificate** kaufen von:
   - DigiCert: https://www.digicert.com/
   - Sectigo: https://sectigo.com/
   - GlobalSign: https://www.globalsign.com/

2. Zertifikat als **PFX/P12** exportieren

3. **Umgebungsvariablen** setzen:

```bash
# Windows PowerShell
$env:CSC_LINK = "C:\pfad\zum\zertifikat.pfx"
$env:CSC_KEY_PASSWORD = "dein-passwort"

# Oder Windows CMD
set CSC_LINK=C:\pfad\zum\zertifikat.pfx
set CSC_KEY_PASSWORD=dein-passwort
```

4. Installer bauen: `npm run dist:win`

⚠️ **WICHTIG:** Niemals Zertifikate oder Passwörter in Git committen!

---

## 🔄 Auto-Update Setup

Die App prüft automatisch auf Updates über GitHub Releases.

### Release erstellen

1. **Version erhöhen** in `package.json`:
   ```json
   "version": "1.0.4"
   ```

2. **Installer bauen**:
   ```bash
   npm run dist:win
   ```

3. **Git Tag erstellen**:
   ```bash
   git tag v1.0.4
   git push origin v1.0.4
   ```

4. **GitHub Release**:
   - Gehe zu: https://github.com/Loggableim/ltth.electron/releases
   - "Create new release"
   - Tag wählen: `v1.0.4`
   - Dateien hochladen:
     - `LTTH Setup 1.0.4.exe`
     - `latest.yml` (aus dist/)
   - "Publish release"

5. **Benutzer erhalten Auto-Update**:
   - App prüft beim Start auf Updates
   - Lädt Update im Hintergrund
   - Installiert automatisch nach 5 Sekunden

---

## 📋 Installer Features

Der NSIS-Installer bietet:

- ✅ **Benutzerdefiniertes Installationsverzeichnis**
- ✅ **Installation für alle Benutzer** (perMachine)
- ✅ **Desktop-Verknüpfung**
- ✅ **Startmenü-Eintrag**
- ✅ **Lizenzvereinbarung** (MIT License)
- ✅ **Saubere Deinstallation**
- ✅ **Professionelles Branding** mit Icon

---

## 🔒 Sicherheit (Security)

Die Electron-App nutzt Best Practices:

- ✅ **nodeIntegration: false** - Kein Node.js im Renderer
- ✅ **contextIsolation: true** - Isolierte Kontexte
- ✅ **preload.js** - Sichere IPC-Bridge
- ✅ **Keine Remote-Inhalte** - Nur lokaler Server

### IPC API (Renderer ↔ Main)

Im Renderer-Prozess (Browser) verfügbar:

```javascript
// App-Version abrufen
const version = await window.electronAPI.getAppVersion();

// Einstellungen speichern/laden
await window.electronAPI.setStoreValue('mySetting', 'value');
const value = await window.electronAPI.getStoreValue('mySetting', 'default');

// Prüfen ob in Electron
if (window.isElectron) {
  console.log('Running in Electron');
}

// Update-Events
window.electronAPI.onUpdateAvailable((info) => {
  console.log('Update verfügbar:', info.version);
});

window.electronAPI.onUpdateDownloaded((info) => {
  console.log('Update heruntergeladen, Neustart in 5 Sekunden');
});
```

---

## 📁 Projekt-Struktur

```
ltth.electron/
├── main.js                    # Electron Main Process
├── preload.js                 # Secure IPC Bridge
├── server.js                  # Express Server (wird von main.js gestartet)
├── package.json               # electron-builder Konfiguration
├── LICENSE.md                 # MIT Lizenz für Installer
├── build/
│   ├── icon.ico              # App-Icon (256x256)
│   └── README.md             # Icon-Anleitung
├── dist/                      # Build-Output (gitignored)
│   ├── LTTH Setup 1.0.3.exe  # Installer
│   └── latest.yml            # Update-Manifest
└── ELECTRON_BUILD_GUIDE.md   # Ausführliche Doku
```

---

## 🛠️ Troubleshooting

### Build schlägt fehl

**"icon.ico not found"**
- Icon erstellen: `build/icon.ico` (siehe `build/README.md`)

**Native Module Fehler**
- Build Tools installieren: `npm install --global windows-build-tools`

### Code Signing Fehler

**"Certificate not found"**
- Pfad in `CSC_LINK` prüfen
- Zertifikat muss PFX/P12 sein

**"Invalid password"**
- `CSC_KEY_PASSWORD` überprüfen

### Auto-Update funktioniert nicht

- GitHub Release muss **veröffentlicht** sein (nicht Draft)
- Version in `package.json` muss höher sein
- `latest.yml` muss im Release sein

---

## 📚 Weiterführende Dokumentation

Siehe **ELECTRON_BUILD_GUIDE.md** für:
- Detaillierte Build-Anleitung
- Code Signing Schritt-für-Schritt
- Auto-Update Konfiguration
- Sicherheits-Best-Practices
- Distribution & Deployment

---

## ✨ Zusammenfassung

Du hast jetzt:

1. ✅ **main.js** - Electron Main Process mit Server-Integration
2. ✅ **preload.js** - Sichere IPC-Bridge
3. ✅ **package.json** - Vollständige electron-builder Config
4. ✅ **Auto-Update** - GitHub Releases Integration
5. ✅ **NSIS Installer** - Professioneller Windows-Installer
6. ✅ **Sicherheit** - Context Isolation & Best Practices

### Nächste Schritte:

1. **Icon erstellen**: `build/icon.ico` (256x256)
2. **Testen**: `npm start`
3. **Bauen**: `npm run dist:win`
4. **Optional**: Code Signing Certificate besorgen
5. **Release**: GitHub Release mit Installer erstellen

---

## 💡 Support

Bei Fragen oder Problemen:
- **Email:** loggableim@gmail.com
- **GitHub Issues:** https://github.com/Loggableim/ltth.electron/issues
- **Dokumentation:** ELECTRON_BUILD_GUIDE.md

---

**Viel Erfolg mit deiner Desktop-App! 🚀**
