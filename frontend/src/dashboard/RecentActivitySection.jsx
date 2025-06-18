// frontend/src/components/dashboard/RecentActivitySection.jsx
export const RecentActivitySection = ({ transactions = [] }) => {
  const { isDarkMode } = useTheme();

  // Get recent transactions (mock data for now)
  const recentTransactions = getRecentTransactions(transactions);

  return (
    <section>
      <h2 className={`
        text-sm font-medium uppercase tracking-wider mb-6
        ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}
      `}>
        Recent Activity
      </h2>
      
      <div className="space-y-3">
        {recentTransactions.map((transaction, index) => (
          <TransactionItem key={index} transaction={transaction} />
        ))}
      </div>
    </section>
  );
};

const TransactionItem = ({ transaction }) => {
  const { isDarkMode } = useTheme();
  const isExpense = transaction.amount < 0;
  const isIncome = transaction.amount > 0;

  return (
    <div className={`
      flex items-center justify-between py-3 border-b
      ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}
    `}>
      <div className={`
        text-sm
        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
      `}>
        {transaction.description}
      </div>
      <div className={`
        text-sm font-mono
        ${isIncome 
          ? 'text-green-500' 
          : isExpense 
            ? 'text-red-500' 
            : isDarkMode ? 'text-white' : 'text-black'
        }
      `}>
        {isIncome ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
      </div>
    </div>
  );
};

function getRecentTransactions(transactions) {
  // If we have real transactions, use them, otherwise mock data
  if (transactions && transactions.length > 0) {
    return transactions.slice(-5).reverse();
  }

  return [
    { description: 'Grocery Store', amount: -67.43 },
    { description: 'Salary Deposit', amount: 2800.00 },
    { description: 'Electric Bill', amount: -89.12 },
    { description: 'Coffee Shop', amount: -4.75 },
    { description: 'Gas Station', amount: -45.20 }
  ];
}

export default {
  ThisMonthSection,
  NetWorthSection,
  BudgetHealthSection,
  SavingsProgressSection,
  RecentActivitySection
};
