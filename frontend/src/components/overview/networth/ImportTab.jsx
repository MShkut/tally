// frontend/src/components/overview/networth/ImportTab.jsx
import React, { useState } from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { ManualEntryForm } from './ManualEntryForm';

export const ImportTab = () => {
  const { isDarkMode } = useTheme();
  const [importType, setImportType] = useState('asset'); // 'asset' or 'liability'
  const [successMessage, setSuccessMessage] = useState('');

  const handleManualSuccess = (item) => {
    setSuccessMessage(`Successfully added ${item.name}`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="space-y-12">
      {/* Asset/Liability Type Selector */}
      <div className="flex gap-4">
        <button
          onClick={() => setImportType('asset')}
          className={`px-6 py-3 rounded-lg text-lg font-light transition-colors ${
            importType === 'asset'
              ? isDarkMode
                ? 'bg-white text-black'
                : 'bg-black text-white'
              : isDarkMode
              ? 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              : 'bg-gray-100 text-gray-600 hover:text-black border border-gray-300'
          }`}
        >
          Asset
        </button>
        <button
          onClick={() => setImportType('liability')}
          className={`px-6 py-3 rounded-lg text-lg font-light transition-colors ${
            importType === 'liability'
              ? isDarkMode
                ? 'bg-white text-black'
                : 'bg-black text-white'
              : isDarkMode
              ? 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              : 'bg-gray-100 text-gray-600 hover:text-black border border-gray-300'
          }`}
        >
          Liability
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className={`py-4 border-l-4 pl-4 ${
          isDarkMode ? 'border-green-500 text-green-400' : 'border-green-600 text-green-700'
        }`}>
          <p className="text-base font-light">{successMessage}</p>
        </div>
      )}

      {/* Manual Entry Form */}
      <div>
        <h2 className={`text-2xl font-light mb-8 ${
          isDarkMode ? 'text-white' : 'text-black'
        }`}>
          Add New {importType === 'asset' ? 'Asset' : 'Liability'}
        </h2>
        <ManualEntryForm itemType={importType} onSuccess={handleManualSuccess} />
      </div>
    </div>
  );
};
