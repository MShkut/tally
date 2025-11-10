// Migration tool for localStorage → SQLite
// This is a temporary tool to help migrate existing data
// REMOVE THIS FILE after migration is complete

const User = require('../models/User');
const UserData = require('../models/UserData');
const Settings = require('../models/Settings');
const Transaction = require('../models/Transaction');
const GiftData = require('../models/GiftData');
const CategoryMapping = require('../models/CategoryMapping');

/**
 * Import data from localStorage export JSON
 *
 * Usage:
 * 1. In browser console, run: JSON.stringify(dataManager.exportData())
 * 2. Copy the output to a file: migration-data.json
 * 3. Run: node migrateTool.js /path/to/migration-data.json password123
 */
async function importFromLocalStorage(jsonData, password) {
  console.log('🔄 Starting migration from localStorage to SQLite...\n');

  try {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

    // Step 1: Create user account
    console.log('👤 Creating user account...');
    const householdName = data.userData?.household?.name || 'My Household';
    const user = await User.create(householdName, password);
    console.log(`✅ User created: ${householdName} (ID: ${user.id})\n`);

    // Step 2: Import user data (income, expenses, savings)
    if (data.userData) {
      console.log('📊 Importing household/income/expenses data...');
      UserData.save(user.id, data.userData);
      console.log('✅ User data imported\n');
    }

    // Step 3: Import settings
    console.log('⚙️  Importing settings...');
    const settings = {
      currency: data.userData?.currency || 'USD',
      theme: 'dark',
      ...data.settings
    };
    Settings.save(user.id, settings);
    console.log('✅ Settings imported\n');

    // Step 4: Import transactions
    if (data.transactions && data.transactions.length > 0) {
      console.log(`💳 Importing ${data.transactions.length} transactions...`);
      Transaction.bulkCreate(user.id, data.transactions);
      console.log(`✅ ${data.transactions.length} transactions imported\n`);
    }

    // Step 5: Import gift data
    if (data.giftData) {
      console.log('🎁 Importing gift data...');
      GiftData.save(user.id, data.giftData);
      console.log('✅ Gift data imported\n');
    }

    // Step 6: Import category mappings
    if (data.categoryMappings || data.merchantMappings) {
      const mappings = data.categoryMappings || data.merchantMappings || {};
      const entries = Object.entries(mappings);

      if (entries.length > 0) {
        console.log(`🏷️  Importing ${entries.length} category mappings...`);
        entries.forEach(([merchant, category]) => {
          CategoryMapping.save(user.id, merchant, category);
        });
        console.log(`✅ ${entries.length} category mappings imported\n`);
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - User: ${householdName}`);
    console.log(`   - Transactions: ${data.transactions?.length || 0}`);
    console.log(`\n🔐 Login credentials:`);
    console.log(`   - Password: [the password you provided]`);
    console.log(`\n⚠️  IMPORTANT: Save these credentials - you'll need them to log in!`);

    return { success: true, userId: user.id };
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Export database to localStorage format (for backup/testing)
 */
function exportToLocalStorage(userId) {
  console.log('📤 Exporting database to localStorage format...\n');

  const userData = UserData.load(userId);
  const transactions = Transaction.findByUser(userId, 10000);
  const giftData = GiftData.load(userId);
  const settings = Settings.load(userId);
  const categoryMappings = CategoryMapping.loadAll(userId);

  const exportData = {
    userData,
    transactions,
    giftData,
    settings,
    categoryMappings,
    exportedAt: new Date().toISOString(),
    version: '1.0.0'
  };

  console.log('✅ Export completed');
  return exportData;
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
📦 Tally Budget - Migration Tool

USAGE:

  Import from localStorage:
    node migrateTool.js import <json-file> <password>

  Export to localStorage format:
    node migrateTool.js export <user-id>

EXAMPLES:

  # Import from localStorage export
  node migrateTool.js import migration-data.json mypassword123

  # Export database to JSON
  node migrateTool.js export 1 > backup.json

GETTING LOCALSTORAGE DATA:

  1. Open Tally in browser (before migration)
  2. Open browser console (F12)
  3. Run: copy(JSON.stringify(dataManager.exportData()))
  4. Paste into a file: migration-data.json
  5. Run this tool with that file
`);
    process.exit(0);
  }

  const command = args[0];

  if (command === 'import') {
    const [, jsonFile, password] = args;

    if (!jsonFile || !password) {
      console.error('❌ Error: Missing required arguments');
      console.error('Usage: node migrateTool.js import <json-file> <password>');
      process.exit(1);
    }

    const fs = require('fs');
    const jsonData = fs.readFileSync(jsonFile, 'utf8');

    importFromLocalStorage(jsonData, password)
      .then(() => {
        console.log('\n✅ Done! You can now log in with your password.');
        process.exit(0);
      })
      .catch(error => {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
      });

  } else if (command === 'export') {
    const [, userId] = args;

    if (!userId) {
      console.error('❌ Error: Missing user ID');
      console.error('Usage: node migrateTool.js export <user-id>');
      process.exit(1);
    }

    const data = exportToLocalStorage(parseInt(userId));
    console.log('\n📄 Export data (copy this):');
    console.log(JSON.stringify(data, null, 2));
    process.exit(0);

  } else {
    console.error(`❌ Unknown command: ${command}`);
    console.error('Valid commands: import, export');
    process.exit(1);
  }
}

module.exports = { importFromLocalStorage, exportToLocalStorage };
