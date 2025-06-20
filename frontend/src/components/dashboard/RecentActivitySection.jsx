// frontend/src/components/dashboard/RecentActivitySection.jsx
import React from 'react';

import { 
  DataSection, 
  EmptyState, 
  TransactionListItem 
} from '../shared/FormComponents';

const RecentActivitySection = ({ transactions = [] }) => {
  // Get only real transactions - no mock data fallback
  const recentTransactions = transactions.slice(-5).reverse();
  
  const renderTransaction = (transaction, index) => (
    <TransactionListItem
      key={transaction.id || index}
      title={transaction.description || 'Unknown Transaction'}
      category={transaction.category}
      amount={transaction.amount}
      isIncome={transaction.amount > 0}
      isExpense={transaction.amount < 0}
    />
  );
  
  const emptyState = (
    <EmptyState
      icon="💳"
      title="No transactions yet"
      description="Import a CSV or add transactions manually to see them here"
    />
  );
  
  return (
    <DataSection
      title="Recent Activity"
      data={recentTransactions}
      renderItem={renderTransaction}
      emptyState={emptyState}
    />
  );
};

export default RecentActivitySection;
