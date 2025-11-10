// ImportNetWorth.jsx - Import historical net worth data from CSV
import React, { useState, useEffect } from 'react';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { useTheme } from 'contexts/ThemeContext';
import { useNetworth } from 'hooks/useNetworth';
import { BurgerMenu } from 'components/shared/BurgerMenu';
import { handleMenuAction } from 'utils/navigationHandler';
import { apiService } from 'utils/apiService';
import { Currency } from 'utils/currency';
import { StandardInput, StandardSelect } from 'components/shared/FormComponents';
import { DatePicker } from 'components/shared/DatePicker';

// Manual Transaction Form Component
const ManualTransactionForm = ({ formData, onUpdate, onAdd, showAddButton = true }) => {
  const { isDarkMode } = useTheme();
  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    setErrors({});

    // Validate inputs
    if (!formData.account_name.trim()) {
      setErrors({ account_name: 'Account name is required' });
      return;
    }
    if (!formData.account_type) {
      setErrors({ account_type: 'Account type is required' });
      return;
    }
    if (!formData.account_category.trim()) {
      setErrors({ account_category: 'Account category is required' });
      return;
    }
    if (!formData.holding_name.trim()) {
      setErrors({ holding_name: 'Holding name is required' });
      return;
    }
    if (!formData.type) {
      setErrors({ type: 'Transaction type is required' });
      return;
    }
    if (!formData.quantity || isNaN(parseFloat(formData.quantity))) {
      setErrors({ quantity: 'Valid quantity is required' });
      return;
    }
    if (!formData.price_per_unit || isNaN(parseFloat(formData.price_per_unit))) {
      setErrors({ price_per_unit: 'Valid price is required' });
      return;
    }

    onAdd();
  };

  const accountTypeOptions = [
    { value: 'asset', label: 'Asset' },
    { value: 'liability', label: 'Liability' }
  ];

  const transactionTypeOptions = [
    { value: 'buy', label: 'Buy' },
    { value: 'sell', label: 'Sell' }
  ];

  const assetTypeOptions = [
    { value: 'stock', label: 'Stock' },
    { value: 'crypto', label: 'Crypto' },
    { value: 'bond', label: 'Bond' },
    { value: 'etf', label: 'ETF' },
    { value: 'mutual_fund', label: 'Mutual Fund' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="space-y-6">
      {/* Row 1: Account Info */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4">
          <StandardInput
            label="Account Name"
            value={formData.account_name}
            onChange={(value) => onUpdate({ ...formData, account_name: value })}
            placeholder="My TFSA"
            error={errors.account_name}
            className="[&_label]:text-base [&_label]:font-light [&_input]:text-base [&_input]:font-light"
          />
        </div>
        <div className="col-span-3">
          <StandardSelect
            label="Account Type"
            value={formData.account_type}
            onChange={(value) => onUpdate({ ...formData, account_type: value })}
            options={accountTypeOptions}
            error={errors.account_type}
            placeholder="Select type"
            className="[&_label]:text-base [&_label]:font-light [&_button]:text-base [&_button]:font-light"
          />
        </div>
        <div className="col-span-5">
          <StandardInput
            label="Account Category"
            value={formData.account_category}
            onChange={(value) => onUpdate({ ...formData, account_category: value })}
            placeholder="Investments, Crypto, etc."
            error={errors.account_category}
            className="[&_label]:text-base [&_label]:font-light [&_input]:text-base [&_input]:font-light"
          />
        </div>
      </div>

      {/* Row 2: Holding Info */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4">
          <StandardInput
            label="Holding Name"
            value={formData.holding_name}
            onChange={(value) => onUpdate({ ...formData, holding_name: value })}
            placeholder="Apple Inc."
            error={errors.holding_name}
            className="[&_label]:text-base [&_label]:font-light [&_input]:text-base [&_input]:font-light"
          />
        </div>
        <div className="col-span-3">
          <StandardInput
            label="Ticker Symbol"
            value={formData.ticker_symbol}
            onChange={(value) => onUpdate({ ...formData, ticker_symbol: value })}
            placeholder="AAPL (optional)"
            className="[&_label]:text-base [&_label]:font-light [&_input]:text-base [&_input]:font-light"
          />
        </div>
        <div className="col-span-3">
          <StandardSelect
            label="Asset Type"
            value={formData.asset_type}
            onChange={(value) => onUpdate({ ...formData, asset_type: value })}
            options={assetTypeOptions}
            placeholder="Select type"
            className="[&_label]:text-base [&_label]:font-light [&_button]:text-base [&_button]:font-light"
          />
        </div>
        <div className="col-span-2">
          <StandardSelect
            label="Type"
            value={formData.type}
            onChange={(value) => onUpdate({ ...formData, type: value })}
            options={transactionTypeOptions}
            error={errors.type}
            placeholder="Buy/Sell"
            className="[&_label]:text-base [&_label]:font-light [&_button]:text-base [&_button]:font-light"
          />
        </div>
      </div>

      {/* Row 3: Transaction Details */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <div>
            <label className={`block text-base font-light mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Date
            </label>
            <DatePicker
              value={formData.date}
              onChange={(isoDate) => onUpdate({ ...formData, date: isoDate })}
              placeholder="Select date"
              className="w-full [&>button]:py-3 [&>button]:pb-4 [&>button]:text-base [&>button]:font-light"
            />
          </div>
        </div>
        <div className="col-span-3">
          <StandardInput
            label="Quantity"
            type="number"
            value={formData.quantity}
            onChange={(value) => onUpdate({ ...formData, quantity: value })}
            placeholder="10"
            error={errors.quantity}
            className="[&_label]:text-base [&_label]:font-light [&_input]:text-base [&_input]:font-light"
          />
        </div>
        <div className="col-span-3">
          <StandardInput
            label="Price Per Unit"
            type="currency"
            value={formData.price_per_unit}
            onChange={(value) => onUpdate({ ...formData, price_per_unit: value })}
            prefix="$"
            placeholder="150.00"
            error={errors.price_per_unit}
            className="[&_label]:text-base [&_label]:font-light [&_input]:text-base [&_input]:font-light"
          />
        </div>
        <div className="col-span-3">
          <div className={`text-base font-light mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Value
          </div>
          <div className={`text-2xl font-light ${isDarkMode ? 'text-white' : 'text-black'} mt-3`}>
            {formData.quantity && formData.price_per_unit
              ? Currency.format(parseFloat(formData.quantity) * parseFloat(formData.price_per_unit))
              : '$0.00'}
          </div>
        </div>
      </div>

      {/* Add transaction button */}
      {showAddButton && (
        <button
          onClick={handleSubmit}
          disabled={!formData.account_name || !formData.holding_name || !formData.quantity || !formData.price_per_unit}
          className={`
            w-full py-6 border-2 border-dashed transition-colors text-center
            ${formData.account_name && formData.holding_name && formData.quantity && formData.price_per_unit
              ? isDarkMode
                ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
              : isDarkMode
                ? 'border-gray-700 text-gray-500 cursor-not-allowed'
                : 'border-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <span className="text-xl font-light">
            Add Transaction
          </span>
        </button>
      )}
    </div>
  );
};

export const ImportNetWorth = ({ onNavigate, onLogout }) => {
  const { isDarkMode } = useTheme();
  const { accounts, loadAccounts } = useNetworth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState('upload'); // 'upload', 'manual'

  // Handle menu state changes to prevent layout shift
  useEffect(() => {
    if (menuOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.paddingRight = '';
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.paddingRight = '';
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleMenuActionWrapper = (actionId) => {
    handleMenuAction(actionId, onNavigate, () => setMenuOpen(false));
  };

  // CSV Upload state
  const [importType, setImportType] = useState('transactions'); // transactions, prices
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState(null);

  // Manual entry state
  const [manualTransactions, setManualTransactions] = useState([{
    id: Date.now(),
    account_name: '',
    account_type: '',
    account_category: '',
    holding_name: '',
    ticker_symbol: '',
    asset_type: 'stock',
    type: '',
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    price_per_unit: ''
  }]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setParsedData([]);
    setValidationErrors([]);
    setImportResults(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target.result;
        const data = parseCSV(csv);
        setParsedData(data);
        validateData(data);
      } catch (error) {
        setValidationErrors([`Failed to parse CSV: ${error.message}`]);
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (csv) => {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }

    return data;
  };

  const validateData = (data) => {
    const errors = [];

    if (data.length === 0) {
      errors.push('CSV file is empty');
      setValidationErrors(errors);
      return;
    }

    if (importType === 'transactions') {
      // Validate transactions format: account_name, account_type, account_category, holding_name, type, date, quantity, price_per_unit
      // Note: Account will be auto-created if it doesn't exist
      data.forEach((row, index) => {
        const rowNum = index + 2;

        if (!row.account_name) {
          errors.push(`Row ${rowNum}: account_name is required`);
        }

        if (!row.account_type) {
          errors.push(`Row ${rowNum}: account_type is required (asset or liability)`);
        } else if (!['asset', 'liability'].includes(row.account_type.toLowerCase())) {
          errors.push(`Row ${rowNum}: account_type must be "asset" or "liability"`);
        }

        if (!row.account_category) {
          errors.push(`Row ${rowNum}: account_category is required (e.g., Investments, Crypto, etc.)`);
        }

        if (!row.holding_name) {
          errors.push(`Row ${rowNum}: holding_name is required`);
        }

        if (!row.type) {
          errors.push(`Row ${rowNum}: type is required`);
        } else if (!['buy', 'sell'].includes(row.type.toLowerCase())) {
          errors.push(`Row ${rowNum}: type must be "buy" or "sell"`);
        }

        if (!row.date) {
          errors.push(`Row ${rowNum}: date is required`);
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
          errors.push(`Row ${rowNum}: date must be in YYYY-MM-DD format`);
        }

        if (!row.quantity && row.quantity !== '0') {
          errors.push(`Row ${rowNum}: quantity is required`);
        } else if (isNaN(parseFloat(row.quantity))) {
          errors.push(`Row ${rowNum}: quantity must be a valid number`);
        }

        if (!row.price_per_unit && row.price_per_unit !== '0') {
          errors.push(`Row ${rowNum}: price_per_unit is required`);
        } else if (isNaN(parseFloat(row.price_per_unit))) {
          errors.push(`Row ${rowNum}: price_per_unit must be a valid number`);
        }
      });
    } else if (importType === 'prices') {
      // Validate prices format: account_name, holding_name, date, price
      data.forEach((row, index) => {
        const rowNum = index + 2;

        if (!row.account_name) {
          errors.push(`Row ${rowNum}: account_name is required`);
        }

        if (!row.holding_name) {
          errors.push(`Row ${rowNum}: holding_name is required`);
        }

        if (!row.date) {
          errors.push(`Row ${rowNum}: date is required`);
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
          errors.push(`Row ${rowNum}: date must be in YYYY-MM-DD format`);
        }

        if (!row.price && row.price !== '0') {
          errors.push(`Row ${rowNum}: price is required`);
        } else if (isNaN(parseFloat(row.price))) {
          errors.push(`Row ${rowNum}: price must be a valid number`);
        }
      });
    }

    setValidationErrors(errors);
  };

  const handleAddNewForm = () => {
    setManualTransactions(prev => [...prev, {
      id: Date.now(),
      account_name: '',
      account_type: '',
      account_category: '',
      holding_name: '',
      ticker_symbol: '',
      asset_type: 'stock',
      type: '',
      date: new Date().toISOString().split('T')[0],
      quantity: '',
      price_per_unit: ''
    }]);
  };

  const handleUpdateManualTransaction = (index, formData) => {
    setManualTransactions(prev => prev.map((item, i) =>
      i === index ? formData : item
    ));
  };

  const handleImportManualTransactions = async () => {
    setIsProcessing(true);
    const results = { success: 0, failed: 0, errors: [] };

    try {
      for (const formData of manualTransactions) {
        // Skip empty forms
        if (!formData.account_name || !formData.holding_name || !formData.quantity || !formData.price_per_unit) {
          continue;
        }

        try {
          // Find or create account
          let account = accounts.find(a => a.name === formData.account_name);

          if (!account) {
            account = await apiService.createNetworthAccount({
              name: formData.account_name,
              type: formData.account_type.toLowerCase(),
              category: formData.account_category,
              tracking_method: 'quantity_based',
              notes: 'Created via manual entry'
            });
            accounts.push(account);
          }

          // Get or create holding
          let holdings = await apiService.getAccountHoldings(account.id);
          let holding = holdings.find(h => h.name === formData.holding_name);

          if (!holding) {
            holding = await apiService.createHolding({
              account_id: account.id,
              name: formData.holding_name,
              ticker_symbol: formData.ticker_symbol || null,
              asset_type: formData.asset_type || 'other'
            });
          }

          // Create transaction
          await apiService.createHoldingTransaction({
            holding_id: holding.id,
            type: formData.type.toLowerCase(),
            date: formData.date,
            quantity: parseFloat(formData.quantity),
            price_per_unit: parseFloat(formData.price_per_unit)
          });
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`${formData.holding_name}: ${error.message}`);
        }
      }

      // Reload accounts
      await loadAccounts();

      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        setActiveView('upload');
        setManualTransactions([{
          id: Date.now(),
          account_name: '',
          account_type: '',
          account_category: '',
          holding_name: '',
          ticker_symbol: '',
          asset_type: 'stock',
          type: '',
          date: new Date().toISOString().split('T')[0],
          quantity: '',
          price_per_unit: ''
        }]);
      }, 2000);
    } catch (error) {
      console.error('Manual import error:', error);
      alert('Import failed: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (validationErrors.length > 0) {
      alert('Please fix validation errors before importing');
      return;
    }

    setIsProcessing(true);
    const results = { success: 0, failed: 0, errors: [] };

    try {
      if (importType === 'transactions') {
        for (const row of parsedData) {
          try {
            // Find or create account
            let account = accounts.find(a => a.name === row.account_name);

            if (!account) {
              // Auto-create account if it doesn't exist
              account = await apiService.createNetworthAccount({
                name: row.account_name,
                type: row.account_type.toLowerCase(),
                category: row.account_category,
                tracking_method: 'quantity_based',
                notes: 'Auto-created during import'
              });
              // Add to accounts array for future lookups in this import
              accounts.push(account);
            }

            // Get or create holding
            let holdings = await apiService.getAccountHoldings(account.id);
            let holding = holdings.find(h => h.name === row.holding_name);

            if (!holding) {
              holding = await apiService.createHolding({
                account_id: account.id,
                name: row.holding_name,
                ticker_symbol: row.ticker_symbol || null,
                asset_type: row.asset_type || 'other'
              });
            }

            // Create transaction
            await apiService.createHoldingTransaction({
              holding_id: holding.id,
              type: row.type.toLowerCase(),
              date: row.date,
              quantity: parseFloat(row.quantity),
              price_per_unit: parseFloat(row.price_per_unit)
            });
            results.success++;
          } catch (error) {
            results.failed++;
            results.errors.push(`${row.holding_name} (${row.date}): ${error.message}`);
          }
        }
      } else if (importType === 'prices') {
        for (const row of parsedData) {
          try {
            const account = accounts.find(a => a.name === row.account_name);

            if (!account) {
              throw new Error(`Account "${row.account_name}" not found. Please import transactions first to create accounts and holdings.`);
            }

            const holdings = await apiService.getAccountHoldings(account.id);
            const holding = holdings.find(h => h.name === row.holding_name);

            if (!holding) {
              throw new Error(`Holding "${row.holding_name}" not found in account "${row.account_name}". Please import transactions first.`);
            }

            await apiService.createPriceUpdate({
              holding_id: holding.id,
              date: row.date,
              price: parseFloat(row.price)
            });
            results.success++;
          } catch (error) {
            results.failed++;
            results.errors.push(`${row.holding_name} (${row.date}): ${error.message}`);
          }
        }
      }

      setImportResults(results);

      // Reload accounts to refresh data
      await loadAccounts();

      // Clear file selection if successful
      if (results.failed === 0) {
        setSelectedFile(null);
        setParsedData([]);
        // Reset file input
        document.getElementById('file-input').value = '';
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getTemplateCSV = () => {
    if (importType === 'transactions') {
      return 'account_name,account_type,account_category,holding_name,ticker_symbol,asset_type,type,date,quantity,price_per_unit\nMy TFSA,asset,Investments,Apple Inc.,AAPL,stock,buy,2025-01-01,10,150.00\nMy TFSA,asset,Investments,Apple Inc.,AAPL,stock,buy,2025-02-01,5,155.00\nCrypto Wallet,asset,Crypto,Bitcoin,BTC,crypto,buy,2025-01-15,0.5,45000.00';
    } else if (importType === 'prices') {
      return 'account_name,holding_name,date,price\nMy TFSA,Apple Inc.,2025-03-01,160.00\nMy TFSA,Apple Inc.,2025-04-01,165.00\nCrypto Wallet,Bitcoin,2025-03-01,48000.00';
    }
  };

  const downloadTemplate = () => {
    const csv = getTemplateCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `networth_${importType}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <BurgerMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onAction={handleMenuActionWrapper}
        currentPage="networth-import"
        onLogout={onLogout}
      />

      <div className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
      }`}>

        {/* Fixed Controls */}
        <button
          onClick={() => setMenuOpen(true)}
          className={`
            fixed top-8 left-8 z-40 p-2 transition-colors duration-200
            ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}
          `}
          aria-label="Open menu"
        >
          <BurgerIcon />
        </button>

        <ThemeToggle />

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-12 ml-16">
            <h1 className={`text-5xl font-light leading-tight mb-4 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              Import Net Worth Data
            </h1>
            <p className={`text-xl font-light ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {activeView === 'manual'
                ? 'Manually enter net worth transactions one at a time'
                : 'Upload a CSV file or manually enter transactions to track your net worth'}
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex space-x-8 mb-12 ml-16">
            <button
              onClick={() => setActiveView('upload')}
              className={`text-xl font-light border-b-2 pb-2 transition-all ${
                activeView === 'upload'
                  ? isDarkMode
                    ? 'text-white border-white'
                    : 'text-black border-black'
                  : isDarkMode
                    ? 'text-gray-400 border-transparent hover:border-gray-400'
                    : 'text-gray-600 border-transparent hover:border-gray-600'
              }`}
            >
              CSV Upload
            </button>
            <button
              onClick={() => setActiveView('manual')}
              className={`text-xl font-light border-b-2 pb-2 transition-all ${
                activeView === 'manual'
                  ? isDarkMode
                    ? 'text-white border-white'
                    : 'text-black border-black'
                  : isDarkMode
                    ? 'text-gray-400 border-transparent hover:border-gray-400'
                    : 'text-gray-600 border-transparent hover:border-gray-600'
              }`}
            >
              Manual Entry
            </button>
          </div>

        {/* CSV Upload View */}
        {activeView === 'upload' && (
          <>
        {/* Import Type Selection */}
        <div className={`p-6 rounded-lg border mb-6 ${
          isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <h2 className="text-xl font-medium mb-4">Import Type</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setImportType('transactions');
                setSelectedFile(null);
                setParsedData([]);
                setValidationErrors([]);
                setImportResults(null);
              }}
              className={`p-4 rounded-lg border text-left transition-colors ${
                importType === 'transactions'
                  ? isDarkMode
                    ? 'bg-blue-900 border-blue-700 text-blue-200'
                    : 'bg-blue-100 border-blue-500 text-blue-700'
                  : isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium mb-1">Transactions</div>
              <div className="text-sm opacity-75">
                Import buy/sell transactions for holdings. Accounts will be auto-created if they don't exist.
              </div>
            </button>

            <button
              onClick={() => {
                setImportType('prices');
                setSelectedFile(null);
                setParsedData([]);
                setValidationErrors([]);
                setImportResults(null);
              }}
              className={`p-4 rounded-lg border text-left transition-colors ${
                importType === 'prices'
                  ? isDarkMode
                    ? 'bg-blue-900 border-blue-700 text-blue-200'
                    : 'bg-blue-100 border-blue-500 text-blue-700'
                  : isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium mb-1">Price Updates</div>
              <div className="text-sm opacity-75">
                Import historical prices for holdings
              </div>
            </button>
          </div>
        </div>

        {/* File Upload */}
        <div className={`p-6 rounded-lg border mb-6 ${
          isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">Upload CSV File</h2>
            <button
              onClick={downloadTemplate}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              📥 Download Template
            </button>
          </div>

          <div className={`border-2 border-dashed rounded-lg p-8 text-center ${
            isDarkMode ? 'border-gray-700' : 'border-gray-300'
          }`}>
            <input
              id="file-input"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label
              htmlFor="file-input"
              className={`cursor-pointer inline-block px-6 py-3 rounded font-medium transition-colors ${
                isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Choose CSV File
            </label>
            {selectedFile && (
              <div className="mt-4">
                <p className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {selectedFile.name}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {parsedData.length} rows parsed
                </p>
              </div>
            )}
          </div>

          {/* Format Instructions */}
          <div className={`mt-4 p-4 rounded ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <h3 className="font-medium mb-2">Required CSV Format:</h3>
            <div className={`text-sm font-mono ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {importType === 'transactions' && (
                <>
                  <div className="mb-2">account_name,account_type,account_category,holding_name,ticker_symbol,asset_type,type,date,quantity,price_per_unit</div>
                  <div className="mt-1 opacity-75">Example: My TFSA,asset,Investments,Apple Inc.,AAPL,stock,buy,2025-01-01,10,150.00</div>
                  <div className="mt-3 text-xs opacity-90">
                    <strong>Note:</strong> If the account doesn't exist, it will be auto-created using the account_type and account_category fields.
                  </div>
                </>
              )}
              {importType === 'prices' && (
                <>
                  <div>account_name,holding_name,date,price</div>
                  <div className="mt-1 opacity-75">Example: My TFSA,Apple Inc.,2025-03-01,160.00</div>
                  <div className="mt-3 text-xs opacity-90">
                    <strong>Note:</strong> Import transactions first to create accounts and holdings before importing price updates.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6 p-4 rounded-lg border border-red-400 bg-red-100">
            <h3 className="font-medium text-red-900 mb-2">Validation Errors ({validationErrors.length}):</h3>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1 max-h-64 overflow-y-auto">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Import Results */}
        {importResults && (
          <div className={`mb-6 p-4 rounded-lg border ${
            importResults.failed === 0
              ? 'border-green-400 bg-green-100'
              : 'border-yellow-400 bg-yellow-100'
          }`}>
            <h3 className={`font-medium mb-2 ${
              importResults.failed === 0 ? 'text-green-900' : 'text-yellow-900'
            }`}>
              Import Complete
            </h3>
            <div className={`text-sm ${
              importResults.failed === 0 ? 'text-green-700' : 'text-yellow-700'
            }`}>
              <p>Successfully imported: {importResults.success} records</p>
              {importResults.failed > 0 && (
                <>
                  <p>Failed: {importResults.failed} records</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 max-h-64 overflow-y-auto">
                    {importResults.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => window.history.back()}
            className={`px-6 py-3 rounded font-medium transition-colors ${
              isDarkMode
                ? 'border border-gray-700 text-gray-300 hover:bg-gray-800'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            ← Back to Dashboard
          </button>

          <button
            onClick={handleImport}
            disabled={!selectedFile || validationErrors.length > 0 || isProcessing}
            className={`px-6 py-3 rounded font-light transition-colors ${
              isDarkMode
                ? 'bg-white text-black hover:bg-gray-100'
                : 'bg-black text-white hover:bg-gray-900'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isProcessing ? 'Importing...' : `Import ${parsedData.length} Records`}
          </button>
        </div>
          </>
        )}

        {/* Manual Entry View */}
        {activeView === 'manual' && (
          <>
            {/* Success message */}
            {showSuccessMessage && (
              <div className="fixed top-8 right-8 z-50">
                <div className={`p-4 rounded-lg border-2 shadow-lg ${
                  isDarkMode
                    ? 'bg-green-900 border-green-700 text-green-300'
                    : 'bg-green-50 border-green-200 text-green-700'
                }`}>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-light">
                      {manualTransactions.filter(t => t.account_name && t.holding_name && t.quantity && t.price_per_unit).length} transaction{manualTransactions.filter(t => t.account_name && t.holding_name && t.quantity && t.price_per_unit).length !== 1 ? 's' : ''} imported successfully!
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Manual Transaction Forms */}
            <div className="space-y-8">
              {manualTransactions.map((formData, index) => (
                <div key={formData.id}>
                  <ManualTransactionForm
                    formData={formData}
                    onUpdate={(updatedData) => handleUpdateManualTransaction(index, updatedData)}
                    onAdd={handleAddNewForm}
                    showAddButton={index === manualTransactions.length - 1}
                  />
                </div>
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center mt-16">
              <button
                onClick={() => setActiveView('upload')}
                className={`text-lg font-light transition-colors ${
                  isDarkMode
                    ? 'text-gray-400 hover:text-white border-b border-gray-700 hover:border-white pb-1'
                    : 'text-gray-600 hover:text-black border-b border-gray-300 hover:border-black pb-1'
                }`}
              >
                Cancel
              </button>

              <button
                onClick={handleImportManualTransactions}
                disabled={!manualTransactions.some(t => t.account_name && t.holding_name && t.quantity && t.price_per_unit) || isProcessing}
                className={`text-xl font-light transition-all ${
                  manualTransactions.some(t => t.account_name && t.holding_name && t.quantity && t.price_per_unit) && !isProcessing
                    ? isDarkMode
                      ? 'text-white border-b-2 border-white hover:border-gray-400 pb-2'
                      : 'text-black border-b-2 border-black hover:border-gray-600 pb-2'
                    : 'text-gray-400 border-b-2 border-gray-400 cursor-not-allowed pb-2'
                }`}
              >
                {isProcessing ? 'Importing...' : 'Import Transactions'}
              </button>
            </div>
          </>
        )}

        <div className="h-24"></div>
      </div>
    </div>
    </>
  );
};

// Helper components
const BurgerIcon = () => (
  <div className="w-5 h-5 flex flex-col justify-between">
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
  </div>
);
