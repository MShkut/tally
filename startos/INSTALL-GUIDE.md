# Tally Budget - Start9 Installation Guide

## Package Information

- **Package File**: `tally-budget.s9pk`
- **Size**: ~48MB
- **Version**: 1.0.0
- **Status**: ✅ Built and verified successfully

## Installation Methods

### Method 1: Sideload via Start9 Web UI (Recommended)

1. **Access your Start9 server's web interface**
   - Navigate to your Start9 server's IP address or hostname in your browser
   - Log in to your Start9 OS dashboard

2. **Navigate to the Marketplace**
   - Click on "Marketplace" or "Services" in the sidebar

3. **Sideload the package**
   - Look for "Sideload" or "Install from file" option
   - Upload the `tally-budget.s9pk` file
   - Wait for the upload and installation to complete

4. **Start the service**
   - Once installed, find "Tally Budget" in your services list
   - Click "Start" to launch the service
   - Wait for the service to initialize

5. **Access Tally Budget**
   - Click on "Tally Budget" to open the web interface
   - Default password: `changeme`
   - **IMPORTANT**: Change the password immediately after first login

### Method 2: Command Line Installation (Advanced)

If you have SSH access to your Start9 server:

```bash
# Copy the package to your Start9 server
scp tally-budget.s9pk user@your-start9-server:/tmp/

# SSH into your Start9 server
ssh user@your-start9-server

# Install the package (exact command may vary by Start9 OS version)
embassy-cli package install /tmp/tally-budget.s9pk

# Start the service
embassy-cli service start tally-budget
```

Note: Commands may vary depending on your Start9 OS version. Consult Start9 documentation for exact CLI commands.

## First Time Setup

### 1. Access the Application

- **Via LAN (HTTPS)**: Available through your Start9 server's web interface
- **Via Tor**: Available through the Tor hidden service (check service info for .onion address)

### 2. Login

- Default password: `changeme`
- This password is shared by all household members
- Multiple users can access simultaneously

### 3. Change Password

⚠️ **SECURITY IMPORTANT**: Change the default password immediately!

The password protects your financial data. Choose something memorable for your household members.

### 4. Complete Onboarding

Follow the multi-step onboarding wizard to set up:
- Household information
- Income details
- Expense categories
- Savings allocations
- Net worth tracking

## Using Tally Budget

### Importing Transactions

1. Navigate to "Import Transactions" from the menu
2. Upload a CSV file from your bank
3. Map columns (date, description, amount)
4. Review and categorize transactions
5. Import to add to your budget

### Managing Your Budget

- **Dashboard**: Overview of budget health and spending
- **Net Worth**: Track assets and liabilities over time
- **Gifts**: Separate gift budget management
- **Plan Period**: Set up budget for upcoming periods

### Data Backup

Your budget data is automatically included in Start9 server backups:
- Backup frequency follows your Start9 backup schedule
- Restore from any backup through Start9 interface
- Data location: `/data` volume (persisted)

## Multi-User Access

- All household members use the same password
- Changes are saved automatically to the server
- Everyone sees the same shared budget data
- No per-user accounts - it's a household budget

## Troubleshooting

### Service Won't Start

1. Check service logs in Start9 dashboard
2. Verify your Start9 OS version is >=0.3.0
3. Try restarting the service
4. Check available disk space

### Can't Access Web Interface

1. Verify service is running (green status)
2. Check if LAN or Tor access is properly configured
3. Try accessing via alternative method (LAN vs Tor)
4. Clear browser cache and try again

### Lost Password

Currently there's no password recovery mechanism. You'll need to:
1. Stop the service
2. Clear the data volume (this will delete all budget data!)
3. Restart and use default password `changeme`
4. Note: This will lose all your budget data - export/backup first if possible

## Technical Details

### Architecture

```
Browser → nginx (port 8080) → Node.js API (port 3001) → /data/budget.json
          ↓
          React SPA (served by nginx)
```

### Data Storage

- Location: `/data` volume (Docker volume managed by Start9)
- Format: JSON files (`budget.json`, `password.txt`)
- Persistence: Survives service restarts and updates

### Ports

- **Internal**: 8080 (nginx)
- **External LAN**: 443 (HTTPS with SSL)
- **External Tor**: 80 (mapped to internal 8080)

## Support

- **GitHub Issues**: https://github.com/MShkut/tally/issues
- **Start9 Documentation**: https://docs.start9.com

## Privacy

Tally runs entirely on your Start9 server. Your financial data:
- Never leaves your server
- Is not shared with third parties
- Is not uploaded to any cloud service
- Stays completely under your control
