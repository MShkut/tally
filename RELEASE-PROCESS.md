# Release Process - Automated Desktop App Builds

This guide explains how to create a new release with automatic installer builds for Mac and Windows.

## 🚀 How It Works

GitHub Actions automatically builds desktop installers for both Mac and Windows whenever you create a release tag. **You don't need access to both platforms** - GitHub's servers handle everything!

---

## 📝 Creating a New Release

### Step 1: Update Version Number

Update the version in `package.json`:

```bash
# Edit package.json and change version
# Example: "version": "0.1.5" → "version": "0.1.6"
```

### Step 2: Commit Changes

```bash
git add package.json
git commit -m "Bump version to 0.1.6"
git push origin main
```

### Step 3: Create and Push a Version Tag

```bash
# Create a tag (must start with 'v')
git tag v0.1.6

# Push the tag to GitHub
git push origin v0.1.6
```

**That's it!** GitHub Actions will automatically:
1. ✅ Build frontend
2. ✅ Build backend
3. ✅ Create macOS installer (.dmg) - Both Intel and Apple Silicon
4. ✅ Create Windows installer (.exe)
5. ✅ Create a GitHub Release
6. ✅ Upload all installers to the release

---

## 📦 What Gets Built

**macOS:**
- `Tally-0.1.6.dmg` - Universal binary (Intel + Apple Silicon)
- Sometimes also separate: `Tally-0.1.6-x64.dmg` and `Tally-0.1.6-arm64.dmg`

**Windows:**
- `Tally Setup 0.1.6.exe` - NSIS installer

---

## 👀 Monitoring the Build

1. Go to your GitHub repository
2. Click **Actions** tab
3. You'll see "Build Desktop App Installers" workflow running
4. Click on it to see progress

Build takes about **5-10 minutes** per platform.

---

## ✅ When Build Completes

1. Go to **Releases** tab on GitHub
2. You'll see a new release: `v0.1.6`
3. Installers are automatically attached as release assets
4. Users can download and install!

---

## 🔧 Alternative: Manual Trigger

You can also trigger builds manually without creating a tag:

1. Go to **Actions** tab
2. Click "Build Desktop App Installers"
3. Click "Run workflow" button
4. Select branch and click "Run workflow"

This builds the installers but **doesn't create a release** - useful for testing.

---

## 🐛 Troubleshooting

### Build Fails on macOS

**Common causes:**
- Icon file missing (`.icns`) - This is OK, build will continue with default icon
- Native module compilation issues - Usually auto-resolves with retry

**Fix:** Re-run the workflow from Actions tab

### Build Fails on Windows

**Common causes:**
- Native module compilation (better-sqlite3)
- Node version mismatch

**Fix:** Check the Actions logs for specific error

### No Installers Uploaded

Check the Actions logs - likely the build succeeded but `dist-electron/` path was wrong.

---

## 📋 Pre-Release Checklist

Before creating a release, make sure:

- [ ] Version number updated in `package.json`
- [ ] All changes committed and pushed
- [ ] Tests passing (if you have tests)
- [ ] CHANGELOG.md updated (optional)
- [ ] No critical bugs

---

## 🎯 Quick Reference

```bash
# Standard release process
git add package.json
git commit -m "Bump version to 0.1.6"
git push origin main
git tag v0.1.6
git push origin v0.1.6

# Wait 5-10 minutes
# Check GitHub Releases - installers will be there!
```

---

## 🔐 Code Signing (Future Enhancement)

Currently, installers are **not code-signed**, so users will see security warnings:

**macOS:** "Tally is from an unidentified developer"
- **Users can bypass:** Right-click → Open → Click "Open"

**Windows:** "Windows protected your PC" SmartScreen warning
- **Users can bypass:** Click "More info" → "Run anyway"

### To Add Code Signing Later:

**macOS:**
1. Enroll in Apple Developer Program ($99/year)
2. Create certificates
3. Add secrets to GitHub:
   - `APPLE_ID`
   - `APPLE_PASSWORD`
   - `APPLE_TEAM_ID`
   - `CSC_LINK` (base64 encoded .p12 certificate)
   - `CSC_KEY_PASSWORD`

**Windows:**
1. Purchase code signing certificate ($200-400/year)
2. Add secrets to GitHub:
   - `CSC_LINK` (base64 encoded .pfx certificate)
   - `CSC_KEY_PASSWORD`

---

## 📊 Build Status Badge (Optional)

Add this to your README.md to show build status:

```markdown
![Build Status](https://github.com/YOUR_USERNAME/tally/actions/workflows/build-release.yml/badge.svg)
```

---

## 🎉 First Release Example

Let's do a test release:

```bash
# Make sure everything is pushed
git push origin main

# Create first release
git tag v0.1.5
git push origin v0.1.5

# Watch the magic happen!
# Go to: https://github.com/YOUR_USERNAME/tally/actions
# After ~10 minutes, check: https://github.com/YOUR_USERNAME/tally/releases
```

Your users can then download the installers from the Releases page!

---

**Questions?** Check the GitHub Actions logs or open an issue.
