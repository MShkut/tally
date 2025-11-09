# Tally Desktop Application

Desktop version of Tally for Windows and macOS, built with Electron.

## 📥 For Users: Download Pre-built Installers

**Don't want to build from source?** Download ready-to-use installers from [GitHub Releases](https://github.com/YOUR_USERNAME/tally/releases)

**macOS:**
1. Download `Tally-{version}.dmg`
2. Open DMG → Drag Tally to Applications
3. Right-click Tally → Open (first launch only, due to unsigned app)

**Windows:**
1. Download `Tally-Setup-{version}.exe`
2. Run installer
3. Click "More info" → "Run anyway" if SmartScreen appears

**See [RELEASE-PROCESS.md](RELEASE-PROCESS.md) for how new versions are released.**

---

## Features

- **Local Mode**: Run Tally entirely on your computer with a built-in backend server
- **Remote Mode**: Connect to your Start9 server or self-hosted instance
- **Native Experience**: System tray, native notifications, and OS integration
- **Cross-Platform**: Works on Windows, macOS (Intel & Apple Silicon)

## Two Modes of Operation

### Local Mode (Standalone)
- Backend runs automatically on `localhost:3001`
- All data stored in your application data folder:
  - **macOS**: `~/Library/Application Support/Tally/data/`
  - **Windows**: `%APPDATA%\Tally\data\`
- Completely self-contained, no server needed
- Data is encrypted via password authentication

### Remote Mode (Client)
- Connects to your Start9 server or self-hosted Tally instance
- Enter server URL on first launch
- All data stored on the server
- Acts as a dedicated desktop client

---

## 🤖 For Maintainers: Automated Releases

**Creating a new release is automatic!**

GitHub Actions builds installers for both Mac and Windows whenever you push a version tag:

```bash
git tag v0.1.6
git push origin v0.1.6
```

That's it! GitHub will:
- Build macOS installer (.dmg)
- Build Windows installer (.exe)
- Create GitHub Release
- Upload installers automatically

**See [RELEASE-PROCESS.md](RELEASE-PROCESS.md) for complete instructions.**

---

## 🛠️ For Developers: Manual Build Instructions

### Prerequisites

Before building manually, ensure you have:
- Node.js 18+ installed
- npm or yarn
- For macOS builds: Xcode Command Line Tools
- For Windows builds: Windows 10/11

### Installation & Setup

### 1. Install Dependencies

From the root directory:

```bash
npm install
```

This installs Electron and electron-builder.

### 2. Build Frontend and Backend

```bash
npm run build:frontend
npm run build:backend
```

This prepares the frontend and backend for packaging.

### 3. Run in Development Mode

To test the app without building installers:

```bash
npm run electron:dev
```

This launches the Electron app in development mode with DevTools enabled.

## Building Installers

### Build for macOS

```bash
npm run electron:build:mac
```

Creates:
- `dist-electron/Tally-0.1.5.dmg` - DMG installer
- `dist-electron/Tally-0.1.5-arm64.dmg` - Apple Silicon
- `dist-electron/Tally-0.1.5-x64.dmg` - Intel

### Build for Windows

```bash
npm run electron:build:win
```

Creates:
- `dist-electron/Tally Setup 0.1.5.exe` - NSIS installer

### Build for Both Platforms

```bash
npm run electron:build
```

Builds installers for all supported platforms (requires appropriate OS).

## Icons

The app uses the Tally icon (4 vertical lines with diagonal strike).

**Current Status:**
- ✅ PNG icon included (`electron/icons/icon.png`)
- ⚠️ macOS `.icns` - Not yet created (will show default Electron icon)
- ⚠️ Windows `.ico` - Not yet created (will show default Electron icon)

### Creating Platform-Specific Icons

**For macOS (.icns):**

```bash
# Install iconutil (comes with Xcode)
# Create iconset folder
mkdir icon.iconset
# Resize icon.png to required sizes: 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024
# Then convert
iconutil -c icns icon.iconset -o electron/icons/icon.icns
```

**For Windows (.ico):**

Use a tool like [icoconverter.com](https://icoconverter.com/) or ImageMagick:

```bash
convert icon.png -define icon:auto-resize=256,128,96,64,48,32,16 electron/icons/icon.ico
```

## First Launch Experience

When you launch the app for the first time:

1. **Setup Wizard appears**
2. Choose your mode:
   - **Run locally** → App starts backend automatically
   - **Connect to server** → Enter server URL
3. Test connection (for remote mode)
4. Complete setup
5. App launches

## Configuration Storage

User preferences are stored using `electron-store`:
- **macOS**: `~/Library/Application Support/Tally/config.json`
- **Windows**: `%APPDATA%\Tally\config.json`

Configuration includes:
```json
{
  "mode": "local" | "remote",
  "serverUrl": "https://your-server.local" (remote only),
  "setupComplete": true
}
```

## Switching Modes

To switch between local and remote mode:

1. Open app settings (implementation pending)
2. Select "Change Connection Mode"
3. Re-run setup wizard
4. Restart app

**Or manually:**

Delete the config file and restart the app:
```bash
# macOS
rm ~/Library/Application\ Support/Tally/config.json

# Windows
del %APPDATA%\Tally\config.json
```

## Development Notes

### File Structure

```
tally/
├── electron/
│   ├── main.js              # Main Electron process
│   ├── preload.js           # Preload script (security bridge)
│   ├── setup-wizard.html    # First-launch UI
│   └── icons/               # App icons
├── frontend/                # React frontend (same as web)
├── backend/                 # Node.js backend (same as Docker)
├── package.json             # Root package with Electron deps
└── DESKTOP-APP.md           # This file
```

### How It Works

**Local Mode:**
1. Electron starts Node.js backend on port 3001
2. Loads frontend from `frontend/dist/index.html`
3. Injects config via `window.electronAPI.mode = 'local'`
4. Frontend connects to `http://localhost:3001` for API calls

**Remote Mode:**
1. Loads frontend from remote server URL
2. Injects config via `window.electronAPI.mode = 'remote'`
3. Frontend uses `window.location.origin` for API calls

### API Base URL Logic

In `frontend/src/utils/apiService.js`:

```javascript
const API_BASE = window.electronAPI?.isElectron
  ? (window.electronAPI.mode === 'local' ? 'http://localhost:3001' : window.electronAPI.serverUrl)
  : window.location.origin;
```

This means:
- **Electron local mode**: Use `http://localhost:3001`
- **Electron remote mode**: Use configured server URL
- **Browser/Docker/Start9**: Use same origin (existing behavior)

## Troubleshooting

### Backend won't start (Local Mode)

Check the logs:
- App writes to console (visible in DevTools)
- Backend may be blocked by firewall
- Port 3001 may be in use

**Fix:**
```bash
# Check if port 3001 is in use
lsof -i :3001  # macOS
netstat -ano | findstr :3001  # Windows
```

### Can't connect to server (Remote Mode)

- Verify server URL is correct (include `https://`)
- Check network connectivity
- Ensure server is running
- Try accessing server URL in browser first

### App shows "Not Registered"

- This is normal on first launch
- Complete the onboarding flow in the app
- If you used Tally before (Docker/Start9), you'll need to re-register or import data

## Code Signing & Notarization

**Current Status:** NOT code signed

Users will see security warnings:
- **macOS**: "Tally is from an unidentified developer"
- **Windows**: "Windows protected your PC" SmartScreen warning

Users can still install by:
- **macOS**: Right-click → Open, then click "Open" in dialog
- **Windows**: Click "More info" → "Run anyway"

### To Enable Code Signing

**macOS:**
1. Enroll in Apple Developer Program ($99/year)
2. Create Developer ID certificate
3. Update `package.json`:
```json
{
  "build": {
    "mac": {
      "identity": "Developer ID Application: Your Name (TEAM_ID)"
    }
  }
}
```

**Windows:**
1. Purchase code signing certificate ($200-400/year)
2. Update `package.json`:
```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/cert.pfx",
      "certificatePassword": "password"
    }
  }
}
```

## Distribution

Once built, distribute installers via:
- GitHub Releases
- Direct download from website
- Auto-update server (optional)

### Auto-Updates

To enable auto-updates, configure `electron-updater`:

1. Set up update server
2. Add to `package.json`:
```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "your-username",
      "repo": "tally"
    }
  }
}
```

3. Implement update checking in `main.js`

## Known Issues

1. **Icons**: Default Electron icons shown until `.icns` and `.ico` are created
2. **Settings UI**: Mode switching not yet implemented in app settings
3. **Auto-update**: Not yet configured
4. **Code signing**: Not implemented (users see security warnings)

## Testing Checklist

- [ ] Local mode: Backend starts successfully
- [ ] Local mode: Can register new user
- [ ] Local mode: Data persists after app restart
- [ ] Remote mode: Can connect to Start9 server
- [ ] Remote mode: Can connect to Docker instance
- [ ] Installer works on macOS Intel
- [ ] Installer works on macOS Apple Silicon
- [ ] Installer works on Windows 10/11

## License

MIT - Same as main Tally project

---

**Questions?** Open an issue on GitHub or check the main README.md
