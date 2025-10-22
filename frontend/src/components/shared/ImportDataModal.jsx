import React, { useState, useRef } from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { dataManager } from 'utils/dataManager';

export const ImportDataModal = ({ isOpen, onClose, onSuccess }) => {
  const { isDarkMode } = useTheme();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    // Prevent default and stop propagation
    event.preventDefault();
    event.stopPropagation();

    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSelectedFile(file);

    // Read and parse the file
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);

        // Validate the data structure
        if (!jsonData.userData && !jsonData.transactions && !jsonData.netWorthData && !jsonData.giftData) {
          setError('Invalid Tally export file. Missing expected data.');
          setFileData(null);
          return;
        }

        setFileData(jsonData);
        console.log('[IMPORT] File loaded and validated successfully');
      } catch (err) {
        console.error('[IMPORT] Parse error:', err);
        setError('Failed to parse JSON file. Please ensure it\'s a valid Tally export.');
        setFileData(null);
      }
    };

    reader.onerror = () => {
      console.error('[IMPORT] File read error');
      setError('Failed to read file.');
      setFileData(null);
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!fileData) return;

    setImporting(true);
    setError(null);

    try {
      console.log('[IMPORT] Starting data import...');
      const success = await dataManager.importData(fileData);

      if (success) {
        console.log('[IMPORT] Data imported successfully');

        // In container mode, try to save to backend
        if (dataManager.containerMode) {
          try {
            console.log('[IMPORT] Saving imported data to container...');
            await dataManager.saveToContainer();
            console.log('[IMPORT] ✓ Saved to container successfully');
          } catch (saveError) {
            // If save fails (likely due to no auth), save to localStorage as fallback
            // This allows import before login - data will sync after login
            console.log('[IMPORT] ⚠️ Container save failed (not authenticated), using localStorage fallback');
            if (fileData.userData) dataManager.saveUserData(fileData.userData);
            if (fileData.transactions) dataManager.saveTransactions(fileData.transactions);
            if (fileData.netWorthData?.assets || fileData.netWorthData?.liabilities) {
              const items = [
                ...(fileData.netWorthData.assets || []),
                ...(fileData.netWorthData.liabilities || [])
              ];
              dataManager.saveNetWorthItems(items);
            }
            if (fileData.giftData) dataManager.saveGiftData(fileData.giftData);
            console.log('[IMPORT] ✓ Saved to localStorage - will sync after login');
          }
        }

        alert('✓ Data imported successfully!');

        // Close modal
        onSuccess?.();
        onClose();

        // Save the current URL path before reload so we can return to it
        const currentPath = window.location.pathname;
        sessionStorage.setItem('tally_returnPath', currentPath);

        // Force a page reload to ensure all components refresh with new data
        // This is necessary because imported data changes the entire app state
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        setError('Failed to import data. Please check the console for details.');
      }
    } catch (err) {
      console.error('[IMPORT] Import error:', err);
      setError(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setFileData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4"
        onClick={handleCancel}
      >
        {/* Modal */}
        <div
          className={`max-w-2xl w-full p-8 rounded-lg ${
            isDarkMode ? 'bg-black border border-gray-800' : 'bg-white border border-gray-200'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-6">
            <h2 className={`text-2xl font-light mb-2 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              Import Data
            </h2>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Import a previously exported Tally data file
            </p>
          </div>

          {/* Warning */}
          <div className={`mb-6 p-4 rounded border ${
            isDarkMode
              ? 'bg-red-900 bg-opacity-20 border-red-800 text-red-400'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <p className="text-sm font-medium mb-1">⚠️ Warning</p>
            <p className="text-sm">
              Importing data will <strong>completely replace</strong> all your current data including:
            </p>
            <ul className="text-sm mt-2 ml-4 space-y-1">
              <li>• Household setup and configuration</li>
              <li>• All transactions</li>
              <li>• Net worth items and history</li>
              <li>• Gift management data</li>
            </ul>
            <p className="text-sm mt-2 font-medium">
              Consider exporting your current data first as a backup.
            </p>
          </div>

          {/* File Input */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Select Tally Export File (JSON)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium ${
                isDarkMode
                  ? 'text-gray-300 file:bg-gray-800 file:text-gray-300 hover:file:bg-gray-700'
                  : 'text-gray-700 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200'
              } cursor-pointer`}
              disabled={importing}
            />
          </div>

          {/* File Info */}
          {selectedFile && fileData && (
            <div className={`mb-6 p-4 rounded border ${
              isDarkMode
                ? 'bg-blue-900 bg-opacity-20 border-blue-800 text-blue-400'
                : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              <p className="text-sm font-medium mb-1">✓ File loaded successfully</p>
              <p className="text-xs mt-1">
                File: {selectedFile.name}
              </p>
              {fileData.exportedAt && (
                <p className="text-xs">
                  Exported: {new Date(fileData.exportedAt).toLocaleString()}
                </p>
              )}
              <div className="text-xs mt-2 space-y-1">
                {fileData.userData && <p>• User data: Found</p>}
                {fileData.transactions && <p>• Transactions: {fileData.transactions.length} items</p>}
                {fileData.netWorthData && (
                  <p>• Net worth: {(fileData.netWorthData.assets?.length || 0) + (fileData.netWorthData.liabilities?.length || 0)} items</p>
                )}
                {fileData.giftData && <p>• Gift data: {fileData.giftData.people?.length || 0} people</p>}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className={`mb-6 p-4 rounded border ${
              isDarkMode
                ? 'bg-red-900 bg-opacity-20 border-red-800 text-red-400'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <button
              onClick={handleCancel}
              disabled={importing}
              className={`px-6 py-2 text-sm font-medium rounded transition-colors ${
                isDarkMode
                  ? 'text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600'
                  : 'text-gray-700 hover:text-black border border-gray-300 hover:border-gray-400'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!fileData || importing}
              className={`px-6 py-2 text-sm font-medium rounded transition-colors ${
                isDarkMode
                  ? 'bg-white text-black hover:bg-gray-100'
                  : 'bg-black text-white hover:bg-gray-800'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {importing ? 'Importing...' : 'Import Data'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
