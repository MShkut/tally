// Development Helper - Open browser console and run these commands

// Clear all data and start fresh
function clearAllData() {
  localStorage.clear();
  console.log('🗑️ All data cleared. Refresh page to start onboarding.');
}

// View current saved data
function viewData() {
  const userData = JSON.parse(localStorage.getItem('financeTracker_userData') || 'null');
  const transactions = JSON.parse(localStorage.getItem('financeTracker_transactions') || '{"transactions":[]}');
  
  console.log('👤 User Data:', userData);
  console.log('💳 Transactions:', transactions.transactions);
  console.log('📊 Summary:', {
    onboardingComplete: userData?.onboardingComplete || false,
    transactionCount: transactions.transactions?.length || 0,
    lastUpdated: userData?.lastUpdated
  });
}

// Add sample transaction
function addSampleTransaction() {
  const transactions = JSON.parse(localStorage.getItem('financeTracker_transactions') || '{"transactions":[]}');
  const sampleTransaction = {
    id: Date.now(),
    date: new Date().toISOString().split('T')[0],
    description: 'Sample Transaction - Grocery Store',
    amount: -45.67,
    category: 'Groceries',
    sample: true
  };
  
  transactions.transactions = transactions.transactions || [];
  transactions.transactions.push(sampleTransaction);
  transactions.lastUpdated = new Date().toISOString();
  transactions.count = transactions.transactions.length;
  
  localStorage.setItem('financeTracker_transactions', JSON.stringify(transactions));
  console.log('✅ Sample transaction added. Refresh dashboard to see it.');
}

// Export all data
function exportData() {
  const userData = localStorage.getItem('financeTracker_userData');
  const transactions = localStorage.getItem('financeTracker_transactions');
  
  const exportData = {
    userData: userData ? JSON.parse(userData) : null,
    transactions: transactions ? JSON.parse(transactions) : null,
    exportedAt: new Date().toISOString()
  };
  
  console.log('📤 Export data (copy this):', JSON.stringify(exportData, null, 2));
}

console.log('🛠️ Development Helper Loaded!');
console.log('Available commands:');
console.log('- clearAllData() - Reset everything');
console.log('- viewData() - See current saved data');
console.log('- addSampleTransaction() - Add test transaction');
console.log('- exportData() - Export all data as JSON');
