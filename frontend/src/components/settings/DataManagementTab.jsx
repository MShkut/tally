// frontend/src/components/settings/DataManagementTab.jsx
import React, { useState } from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { apiService } from 'utils/apiService';
import { ConfirmationModal } from 'components/shared/FormComponents';

export const DataManagementTab = ({ onNavigate }) => {
  const { isDarkMode } = useTheme();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const handleExport = async () => {
    try {
      const exportData = await apiService.exportData();

      // Create downloadable file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      // Create download link
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tally-export-${new Date().toISOString().split('T')[0]}.json`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      setStatusMessage('✓ Data exported successfully');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      console.error('❌ Failed to export data:', error);
      setStatusMessage('Failed to export data. Please try again.');
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
      setShowImportModal(true);
    }
  };

  const confirmImport = () => {
    if (!importFile) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        await apiService.importData(importedData);
        setStatusMessage('✓ Data imported successfully');
        setTimeout(() => setStatusMessage(''), 3000);
        setShowImportModal(false);
        setImportFile(null);
        // Reload page to reflect imported data
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        console.error('❌ Failed to import data:', error);
        setStatusMessage('Failed to import data. Invalid file format.');
        setTimeout(() => setStatusMessage(''), 5000);
        setShowImportModal(false);
        setImportFile(null);
      }
    };
    reader.readAsText(importFile);
  };

  const handleReset = async () => {
    try {
      await apiService.resetAllData();
      setStatusMessage('✓ All data reset successfully');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('❌ Failed to reset data:', error);
      setStatusMessage('Failed to reset data. Please try again.');
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };

  return (
    <div className="space-y-12 max-w-2xl">
      {/* Export Data */}
      <div className="space-y-4">
        <div>
          <h3 className={`text-lg font-light mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Export Data
          </h3>
          <p className={`text-sm font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Download all your data as a JSON file for backup
          </p>
        </div>

        <button
          onClick={handleExport}
          className={`px-6 py-3 border-2 font-light transition-all ${
            isDarkMode
              ? 'border-white text-white hover:bg-white hover:text-black'
              : 'border-black text-black hover:bg-black hover:text-white'
          }`}
        >
          Export Data
        </button>
      </div>

      {/* Import Data */}
      <div className="space-y-4">
        <div>
          <h3 className={`text-lg font-light mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Import Data
          </h3>
          <p className={`text-sm font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Import data from a previously exported JSON file
          </p>
        </div>

        <div>
          <input
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className={`block w-full text-sm font-light file:mr-4 file:py-3 file:px-6 file:border-2 file:font-light file:cursor-pointer file:transition-all ${
              isDarkMode
                ? 'text-gray-400 file:border-white file:text-white file:bg-black file:hover:bg-white file:hover:text-black'
                : 'text-gray-600 file:border-black file:text-black file:bg-white file:hover:bg-black file:hover:text-white'
            }`}
          />
        </div>
      </div>

      {/* Reset All Data */}
      <div className="space-y-4 pt-8 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}">
        <div>
          <h3 className={`text-lg font-light mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            Reset All Data
          </h3>
          <p className={`text-sm font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Permanently delete all data and reset the application. This cannot be undone.
          </p>
        </div>

        <button
          onClick={() => setShowResetConfirm(true)}
          className={`px-6 py-3 border-2 font-light transition-all ${
            isDarkMode
              ? 'border-red-600 text-red-400 hover:bg-red-600 hover:text-white'
              : 'border-red-600 text-red-600 hover:bg-red-600 hover:text-white'
          }`}
        >
          Reset All Data
        </button>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className={`p-4 rounded-lg border-l-4 ${
          statusMessage.startsWith('✓')
            ? isDarkMode
              ? 'bg-green-900/20 border-green-600 text-green-400'
              : 'bg-green-100 border-green-500 text-green-700'
            : isDarkMode
            ? 'bg-red-900/20 border-red-600 text-red-400'
            : 'bg-red-100 border-red-500 text-red-700'
        }`}>
          <p className="text-sm font-light">{statusMessage}</p>
        </div>
      )}

      {/* Import Confirmation Modal */}
      <ConfirmationModal
        isOpen={showImportModal}
        title="Import Data?"
        description="This will replace all your current data with the imported data. Make sure you have exported your current data first."
        confirmText="Import"
        cancelText="Cancel"
        onConfirm={confirmImport}
        onCancel={() => {
          setShowImportModal(false);
          setImportFile(null);
        }}
        confirmDanger={true}
      />

      {/* Reset Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResetConfirm}
        title="Reset All Data?"
        description="This will permanently delete all your data including transactions, budgets, and settings. This action cannot be undone."
        confirmText="Reset Everything"
        cancelText="Cancel"
        onConfirm={handleReset}
        onCancel={() => setShowResetConfirm(false)}
        confirmDanger={true}
      />
    </div>
  );
};
