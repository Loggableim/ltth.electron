# Build-Installer.bat - Dokumentation

## Übersicht

Die `build-installer.bat` Datei ist ein vollautomatischer Windows Batch-Skript, das eine vollständige Electron-Anwendung baut und eine Windows-Setup.exe erstellt. Das Skript ist für die direkte Ausführung per Doppelklick konzipiert und erfordert keine manuellen Eingaben.

## Funktionsweise

Das Skript führt folgende Schritte automatisch und sequenziell aus:

### Schritt 1: Node.js Überprüfung
- Prüft ob Node.js auf dem System installiert ist
- Zeigt die installierte Node.js Version an
- **Abbruch bei Fehler**: Wenn Node.js nicht gefunden wird, wird eine Fehlermeldung angezeigt und das Skript beendet

### Schritt 2: npm Überprüfung
- Prüft ob npm (Node Package Manager) verfügbar ist
- Zeigt die installierte npm Version an
- **Abbruch bei Fehler**: Wenn npm nicht gefunden wird, wird empfohlen Node.js neu zu installieren

### Schritt 3: electron-builder Installation
- Prüft ob `electron-builder` bereits im Projekt installiert ist (in `node_modules`)
- Falls nicht vorhanden: Installiert `electron-builder` automatisch lokal mit `npm install --save-dev electron-builder`
- **Abbruch bei Fehler**: Bei Installationsproblemen wird der Fehler in `build-error.log` gespeichert

### Schritt 4: Dependencies installieren
- Führt `npm install` aus um alle Projekt-Abhängigkeiten zu installieren
- Kann mehrere Minuten dauern, abhängig von der Internetverbindung
- **Abbruch bei Fehler**: Fehler werden in `build-error.log` protokolliert

### Schritt 5: Alte Builds bereinigen
- Löscht den `dist` Ordner falls vorhanden
- Löscht den `build` Ordner falls vorhanden
- Stellt sicher, dass der Build-Prozess mit einem sauberen Zustand startet

### Schritt 6: App-Bundle bauen
- Führt `npm run build` aus (baut CSS mit Tailwind)
- Dies ist der Standard-Build-Befehl aus der `package.json`
- **Abbruch bei Fehler**: Build-Fehler werden in `build-error.log` gespeichert

### Schritt 7: electron-builder Konfiguration
- Prüft ob `electron-builder.yml` oder `electron-builder.json` existiert
- **Falls keine Config vorhanden**: Erstellt automatisch eine `electron-builder.yml` mit folgenden Standardeinstellungen:
  - **appId**: `com.tiktokstreamtool.app`
  - **productName**: `TikTok Stream Tool`
  - **directories.output**: `dist`
  - **win.target**: `nsis` (NSIS Installer für Windows)
  - **NSIS Optionen**: 
    - Kein One-Click Installer (Benutzer kann Installationsort wählen)
    - Desktop-Verknüpfung erstellen
    - Startmenü-Verknüpfung erstellen
  - **Files**: Intelligente Filterung von unnötigen Dateien (Tests, Docs, etc.)

### Schritt 8: Windows Setup.exe erstellen
- Erstellt `main.js` falls nicht vorhanden (Electron Entry Point)
  - Startet einen BrowserWindow
  - Startet den Node.js Server (`server.js`) als Child Process
  - Lädt die App-URL (`http://localhost:3000`)
  - Behandelt Window-Lifecycle-Events
- Führt `npx electron-builder --win --x64` aus
- Erstellt die Windows Setup.exe im `dist` Ordner
- **Bei Erfolg**: 
  - Zeigt Erfolgsmeldung an
  - Listet erstellte `.exe` Dateien auf
  - Öffnet den `dist` Ordner im Windows Explorer
- **Bei Fehler**: 
  - Zeigt Fehlermeldung an
  - Gibt den Inhalt von `build-error.log` aus

## Verwendete Befehle im Detail

### Windows Batch Befehle
- `@echo off` - Deaktiviert die Anzeige der Befehle während der Ausführung
- `setlocal enabledelayedexpansion` - Ermöglicht verzögerte Variablenerweiterung
- `chcp 65001` - Setzt UTF-8 Codepage für korrekte Umlaute
- `where <command>` - Sucht nach einem Befehl im PATH
- `if %ERRORLEVEL% NEQ 0` - Prüft ob der letzte Befehl fehlgeschlagen ist
- `call` - Führt einen anderen Batch-Befehl aus und kehrt zurück
- `rmdir /s /q` - Löscht Verzeichnisse rekursiv ohne Nachfrage
- `start explorer` - Öffnet Windows Explorer

### npm/Node.js Befehle
- `node --version` - Zeigt Node.js Version
- `npm --version` - Zeigt npm Version
- `npm install --save-dev electron-builder` - Installiert electron-builder als Dev-Dependency
- `npm install` - Installiert alle Dependencies aus package.json
- `npm run build` - Führt Build-Skript aus package.json aus
- `npx electron-builder --win --x64` - Führt electron-builder aus (64-bit Windows Build)

## Fehlerbehandlung

- **Jeder kritische Schritt** wird auf Fehler überprüft
- Bei Fehlern:
  - Wird eine aussagekräftige Fehlermeldung ausgegeben
  - Fehlerdetails werden in `build-error.log` gespeichert
  - Das Skript pausiert (mit `pause`) damit Benutzer die Meldung lesen können
  - Das Skript beendet sich mit Exit-Code 1
- Bei Erfolg:
  - Exit-Code 0
  - `dist` Ordner wird automatisch geöffnet

## Ausgabedateien

Nach erfolgreichem Build befinden sich im `dist` Ordner:
- `TikTok Stream Tool Setup <version>.exe` - Der Windows Installer
- Möglicherweise weitere Dateien wie `.yml` Metadaten

## Voraussetzungen

- **Windows Betriebssystem** (7, 8, 10, 11)
- **Node.js 18.0.0+** installiert (https://nodejs.org)
- **npm** (wird mit Node.js installiert)
- **Internetverbindung** für npm install
- **Ausreichend Festplattenspeicher** (~1-2 GB für node_modules und Build)

## Verwendung

1. Doppelklick auf `build-installer.bat`
2. Warten bis der Prozess abgeschlossen ist (kann 5-15 Minuten dauern)
3. Bei Erfolg öffnet sich automatisch der `dist` Ordner
4. Die Setup.exe kann auf anderen Windows-Systemen verteilt werden

## Fehlerbehebung

### "Node.js ist nicht installiert"
- Node.js von https://nodejs.org herunterladen und installieren
- LTS Version (18 oder 20) empfohlen
- Nach Installation: Terminal/CMD neu starten

### "npm install fehlgeschlagen"
- Internetverbindung prüfen
- `build-error.log` lesen für Details
- Proxy-Einstellungen prüfen falls hinter Firewall
- Manuell `npm cache clean --force` ausführen

### "electron-builder fehlgeschlagen"
- `build-error.log` für Details prüfen
- Möglicherweise fehlen Windows Build Tools
- Node.js Version prüfen (>=18.0.0 erforderlich)
- Ausreichend Festplattenspeicher sicherstellen

### "main.js Fehler"
- Falls die generierte `main.js` nicht funktioniert, manuell anpassen
- Electron Hauptprozess-Code muss korrekt sein
- Server-Port (3000) muss verfügbar sein

## Anpassungen

### Produktname ändern
In `electron-builder.yml` (wird automatisch erstellt):
```yaml
productName: Dein Produktname
appId: com.dein.app.id
```

### Icon ändern
```yaml
win:
  icon: pfad/zu/deinem/icon.ico
```

### Installer-Optionen
```yaml
nsis:
  oneClick: true  # One-Click Installer
  allowToChangeInstallationDirectory: false
  createDesktopShortcut: false
```

## Hinweise

- Das Skript ist **idempotent**: Kann mehrfach ausgeführt werden
- **Keine Benutzereingaben erforderlich**: Vollständig automatisiert
- **Windows-spezifisch**: Funktioniert nur auf Windows
- **Bereinigt automatisch**: Alte Builds werden gelöscht
- **Fehlerprotokollierung**: Alle Fehler landen in `build-error.log`

## Technische Details

### Warum main.js erstellt wird
Electron benötigt einen Entry Point (Hauptprozess). Da dieses Projekt ursprünglich ein Node.js Web-Server ist (`server.js`), wird automatisch eine `main.js` erstellt, die:
1. Ein Electron BrowserWindow erstellt
2. Den Node.js Server als Child Process startet
3. Die Webapp im BrowserWindow lädt

### Electron-Builder Konfiguration
Die automatisch erstellte `electron-builder.yml` ist für NSIS (Nullsoft Scriptable Install System) konfiguriert - der Standard Windows Installer. NSIS bietet:
- Professionelle Installer-UI
- Deinstallations-Funktion
- Registry-Einträge
- Start Menu Integration
- Desktop Shortcuts

### File Filtering
Die Config filtert automatisch unnötige Dateien aus dem Build:
- Dokumentation (.md Dateien)
- Tests
- Source Control (.git)
- IDE-Konfigurationen
- Node Module Metadaten
Dadurch wird die Installer-Größe optimiert.

## Support

Bei Problemen:
1. `build-error.log` prüfen
2. GitHub Issues des Projekts
3. E-Mail: loggableim@gmail.com
