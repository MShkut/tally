# Tally Update Guide - Version 0.0.2

## What's New in v0.0.2

### Critical Bug Fixes
- ✅ **Login screen now appears** - Fixed container mode detection with health check loop
- ✅ **Data persists after restart** - Fixed data persistence with manual save button
- ✅ **Household names with `&` work** - Implemented householdId-based routing

### New Features
- ✅ **JSON Import/Export** - Full backup and restore capability
- ✅ **Manual Save Button** - Explicit "Save Data" option in Settings menu
- ✅ **Improved Logging** - Better debugging with startup and file operation logs

---

## How to Update on Start9

### Option 1: Sideload Update (Recommended - Preserves Data)

**Your data will be preserved with this method!**

1. **Download the new package:**
   - The new `.s9pk` file is located at: `/home/mitch/tally/tally-budget.s9pk`
   - File size: ~49 MB
   - Version: 0.0.2

2. **In Start9 UI:**
   - Go to **System** → **Sideload Service**
   - Upload `tally-budget.s9pk`
   - Start9 will detect it's an update (version 0.0.1 → 0.0.2)
   - Click **Install Update**
   - Your data in `/data` volume will be preserved

3. **After Update:**
   - Service will restart automatically
   - Check logs for: `[STARTUP] ✓ Tally API server ready on port 3001`
   - Login with your existing password
   - Your data should still be there!

### Option 2: Manual Reinstall (Last Resort - LOSES DATA)

**⚠️ WARNING: This will delete all your data!**

Only use this if sideload update fails:

1. **Before uninstalling** - Export your data:
   - In Tally: Settings → Export Data
   - Save the JSON file somewhere safe

2. **Uninstall old version:**
   - In Start9: Go to Tally → Config → Uninstall
   - Confirm uninstall

3. **Install new version:**
   - System → Sideload Service
   - Upload `tally-budget.s9pk`
   - Install

4. **Restore your data:**
   - Login with default password: `changeme`
   - Settings → Import Data
   - Upload your exported JSON file
   - Settings → Save Data

---

## Testing Checklist After Update

Once updated, verify these features work:

### Authentication & Startup
- [ ] Login screen appears
- [ ] Can login successfully
- [ ] Check logs show: `[STARTUP] ✓ Tally API server ready`
- [ ] Check logs show: `[STARTUP] Data directory is writable ✓`

### Data Persistence
- [ ] Your existing data is still there (if sideload update)
- [ ] Make a change (add transaction, edit budget, etc.)
- [ ] Click Settings → **Save Data**
- [ ] Verify success message appears
- [ ] Restart the service in Start9
- [ ] Login again
- [ ] Verify your changes persisted

### New Features
- [ ] Settings menu has **Save Data** button
- [ ] Settings menu has **Import Data** button
- [ ] Settings menu has **Export Data** button (already existed)
- [ ] Export Data downloads a JSON file
- [ ] Import Data shows file upload modal with warnings

### Household Name with Special Characters
- [ ] Create new household with name "Test & Demo"
- [ ] Name displays correctly with `&` symbol
- [ ] URL uses householdId (e.g., `/household-1234567890/dashboard`)
- [ ] Navigation works correctly

### Logging (Check Start9 Logs)
- [ ] Startup logs show API server initialization
- [ ] Logs show when data is loaded: `[DATA] ✓ Budget data loaded`
- [ ] Logs show when data is saved: `[DATA] ✓ Budget data saved`

---

## Troubleshooting

### Login screen doesn't appear
- Check logs for: `[STARTUP] ✓ Tally API server ready`
- If not present, server didn't start correctly
- Check for errors in logs

### Data not persisting
- Make sure to click **Save Data** after making changes
- Check logs for: `[DATA] ✓ Budget data saved successfully`
- If no log, save didn't happen
- Try saving again

### Update fails
- Try stopping Tally service first, then update
- If still fails, use manual reinstall method
- **Remember to export data first!**

---

## Version History

### v0.0.2 (Current)
- Fixed login screen appearing
- Fixed data persistence
- Added JSON import/export
- Fixed household names with special characters
- Added manual save button
- Improved logging

### v0.0.1 (Initial Release)
- Basic functionality
- Container deployment
- Password authentication
- CSV import
- Budget tracking

---

## Package Location

New package file: `/home/mitch/tally/tally-budget.s9pk`

To copy to another location:
```bash
cp /home/mitch/tally/tally-budget.s9pk ~/Downloads/
```

Then you can upload it to Start9 from your Downloads folder.
