// ImportNetWorth.jsx - Import historical net worth data from CSV
import React, { useState } from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { useNetworth } from 'hooks/useNetworth';
import { apiService } from 'utils/apiService';
import { currency } from 'utils/currency';

export const ImportNetWorth = () => {
  const { isDarkMode } = useTheme();
  const { accounts, loadAccounts } = useNetworth();

  const [importType, setImportType] = useState('snapshots'); // snapshots, transactions, prices
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState(null);

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

    if (importType === 'snapshots') {
      // Validate snapshots format: account_name, date, balance
      data.forEach((row, index) => {
        const rowNum = index + 2; // +2 because index starts at 0 and row 1 is headers

        if (!row.account_name) {
          errors.push(`Row ${rowNum}: account_name is required`);
        } else {
          const account = accounts.find(a => a.name === row.account_name);
          if (!account) {
            errors.push(`Row ${rowNum}: Account "${row.account_name}" not found`);
          } else if (account.tracking_method !== 'simple') {
            errors.push(`Row ${rowNum}: Account "${row.account_name}" is not a simple balance account`);
          }
        }

        if (!row.date) {
          errors.push(`Row ${rowNum}: date is required`);
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
          errors.push(`Row ${rowNum}: date must be in YYYY-MM-DD format`);
        }

        if (!row.balance && row.balance !== '0') {
          errors.push(`Row ${rowNum}: balance is required`);
        } else if (isNaN(parseFloat(row.balance))) {
          errors.push(`Row ${rowNum}: balance must be a valid number`);
        }
      });
    } else if (importType === 'transactions') {
      // Validate transactions format: account_name, holding_name, type, date, quantity, price_per_unit
      data.forEach((row, index) => {
        const rowNum = index + 2;

        if (!row.account_name) {
          errors.push(`Row ${rowNum}: account_name is required`);
        } else {
          const account = accounts.find(a => a.name === row.account_name);
          if (!account) {
            errors.push(`Row ${rowNum}: Account "${row.account_name}" not found`);
          } else if (account.tracking_method !== 'quantity_based') {
            errors.push(`Row ${rowNum}: Account "${row.account_name}" is not a quantity-based account`);
          }
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

  const handleImport = async () => {
    if (validationErrors.length > 0) {
      alert('Please fix validation errors before importing');
      return;
    }

    setIsProcessing(true);
    const results = { success: 0, failed: 0, errors: [] };

    try {
      if (importType === 'snapshots') {
        for (const row of parsedData) {
          try {
            const account = accounts.find(a => a.name === row.account_name);
            await apiService.createSnapshot({
              account_id: account.id,
              date: row.date,
              balance: parseFloat(row.balance),
              source: 'import'
            });
            results.success++;
          } catch (error) {
            results.failed++;
            results.errors.push(`${row.account_name} (${row.date}): ${error.message}`);
          }
        }
      } else if (importType === 'transactions') {
        for (const row of parsedData) {
          try {
            const account = accounts.find(a => a.name === row.account_name);

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
            const holdings = await apiService.getAccountHoldings(account.id);
            const holding = holdings.find(h => h.name === row.holding_name);

            if (!holding) {
              throw new Error('Holding not found');
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
    if (importType === 'snapshots') {
      return 'account_name,date,balance\nMy Chequing,2025-01-01,5000.00\nMy Savings,2025-01-01,10000.00';
    } else if (importType === 'transactions') {
      return 'account_name,holding_name,ticker_symbol,asset_type,type,date,quantity,price_per_unit\nMy TFSA,Apple Inc.,AAPL,stock,buy,2025-01-01,10,150.00\nMy TFSA,Apple Inc.,AAPL,stock,buy,2025-02-01,5,155.00';
    } else if (importType === 'prices') {
      return 'account_name,holding_name,date,price\nMy TFSA,Apple Inc.,2025-03-01,160.00\nMy TFSA,Apple Inc.,2025-04-01,165.00';
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
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light mb-2">Import Net Worth Data</h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Import historical data from CSV files to populate your net worth tracking
          </p>
        </div>

        {/* Import Type Selection */}
        <div className={`p-6 rounded-lg border mb-6 ${
          isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <h2 className="text-xl font-medium mb-4">Import Type</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setImportType('snapshots');
                setSelectedFile(null);
                setParsedData([]);
                setValidationErrors([]);
                setImportResults(null);
              }}
              className={`p-4 rounded-lg border text-left transition-colors ${
                importType === 'snapshots'
                  ? isDarkMode
                    ? 'bg-blue-900 border-blue-700 text-blue-200'
                    : 'bg-blue-100 border-blue-500 text-blue-700'
                  : isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium mb-1">Balance Snapshots</div>
              <div className="text-sm opacity-75">
                Import historical balances for simple accounts
              </div>
            </button>

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
                Import buy/sell transactions for holdings
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
              {importType === 'snapshots' && (
                <>
                  <div>account_name,date,balance</div>
                  <div className="mt-1 opacity-75">Example: My Chequing,2025-01-01,5000.00</div>
                </>
              )}
              {importType === 'transactions' && (
                <>
                  <div>account_name,holding_name,ticker_symbol,asset_type,type,date,quantity,price_per_unit</div>
                  <div className="mt-1 opacity-75">Example: My TFSA,Apple Inc.,AAPL,stock,buy,2025-01-01,10,150.00</div>
                </>
              )}
              {importType === 'prices' && (
                <>
                  <div>account_name,holding_name,date,price</div>
                  <div className="mt-1 opacity-75">Example: My TFSA,Apple Inc.,2025-03-01,160.00</div>
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
            className={`px-6 py-3 rounded font-medium transition-colors ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isProcessing ? 'Importing...' : `Import ${parsedData.length} Records`}
          </button>
        </div>
      </div>
    </div>
  );
};
