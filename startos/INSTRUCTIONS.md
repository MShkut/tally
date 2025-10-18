# Tally Budget

Privacy-first household budget tracker running on your Start9 server.

## Initial Setup

1. Access Tally via the web interface
2. Default password: `changeme`
3. **IMPORTANT:** Change your password immediately after first login
4. Complete the onboarding flow to set up your household budget

## Features

- **Transaction Import**: Upload CSV files from your bank to import transactions
- **Budget Tracking**: Track spending by category and monitor budget health
- **Net Worth Tracking**: Monitor assets and liabilities over time
- **Gift Budget Management**: Separate budget for gift planning and tracking
- **Privacy-First**: All data stored locally on your Start9 server - never leaves your control

## Usage

### Accessing the App

Access Tally through your Start9 server's web interface. The app is available via both LAN (with SSL) and Tor.

### Authentication

- All users share a single password
- Multiple household members can access simultaneously
- Everyone sees the same shared budget data
- Changes are saved automatically to your server

### Importing Transactions

1. Navigate to "Import Transactions" from the main menu
2. Upload a CSV file from your bank
3. Map columns (date, description, amount)
4. Review and categorize transactions
5. Import to add to your budget tracking

### Managing Your Budget

- **Dashboard**: Overview of budget health, spending, and balances
- **Net Worth**: Track assets and liabilities
- **Gifts**: Manage gift budget separately from household expenses
- **Plan Period**: Set up budget for upcoming periods

## Data Backup

Your budget data is automatically included in your Start9 server backups. You can restore your data from any backup through the Start9 interface.

## Multi-User Access

Multiple household members can access the same budget by sharing the password. All users see and edit the same shared budget data in real-time.

## Security Note

Since this is a shared household budget, change the default password to something memorable for your household members. The password protects your financial data from unauthorized access.

## Support

For issues, questions, or feature requests:
- GitHub Issues: https://github.com/MShkut/tally/issues

## Privacy

Tally runs entirely on your Start9 server. Your financial data never leaves your server and is never shared with third parties.
