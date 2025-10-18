# Tally Budget - Start9 Package

This directory contains the Start9 package configuration for Tally Budget.

## Package Status

✅ **Package Build Ready** - All core files created and tested

### Completed Files

- ✅ `manifest.yaml` - Service metadata and configuration
- ✅ `health-check.sh` - Health check script
- ✅ `INSTRUCTIONS.md` - User-facing documentation
- ✅ `LICENSE` - MIT license
- ✅ `Makefile` - Build automation
- ✅ `scripts/backup/create.sh` - Backup script
- ✅ `scripts/backup/restore.sh` - Restore script

### Missing (Optional)

- ⚠️ `icon.png` - 512x512 app icon (recommended but not required for testing)

## Building the Package

### Build Docker Image

```bash
cd startos
make install
```

This will:
1. Build the Docker image from the existing Dockerfile
2. Tag it appropriately for Start9: `start9/tally-budget/main:1.0.0`

### Create .s9pk Package (Requires Start9 SDK)

```bash
# Install Start9 SDK first
# See: https://docs.start9.com/latest/developer-docs/packaging

# Build the package
start9-sdk pack
```

This will create `tally-budget.s9pk` that can be installed on Start9 OS.

## Testing on Start9

### Option 1: Local Testing

1. Install Start9 SDK tools
2. Build package: `start9-sdk pack`
3. Install via Start9 web UI or CLI
4. Test all functionality

### Option 2: Direct Install

If you have a Start9 server running:

```bash
# Build package
start9-sdk pack

# Install on Start9 (replace with your server address)
start9-cli package install tally-budget.s9pk
```

## Next Steps

1. **Create Icon (Optional)**: Add a 512x512 PNG icon for the app
2. **Install Start9 SDK**: Follow Start9 developer docs to install SDK tools
3. **Build Package**: Run `start9-sdk pack` to create .s9pk file
4. **Test on Start9**: Install and test on actual Start9 OS
5. **Submit to Registry**: Once tested, submit to Start9 marketplace

## Package Features

- **Password Authentication**: Default password `changeme` (users should change on first login)
- **Data Persistence**: All data stored in `/data` volume
- **Backup/Restore**: Automatic backup integration with Start9
- **Health Checks**: HTTP health check on `/api/health` endpoint
- **Multi-Access**: LAN (HTTPS) and Tor access supported

## Architecture

```
Browser → nginx (port 8080) → Node.js API (port 3001) → /data/budget.json
          ↓
          React SPA (served by nginx)
```

## Support

- GitHub Issues: https://github.com/MShkut/tally/issues
- Start9 Docs: https://docs.start9.com
