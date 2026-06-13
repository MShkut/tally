// frontend/src/components/settings/DataManagementTab.jsx
import { useState } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { apiService } from 'utils/apiService';
import { ConfirmationModal } from 'components/shared/FormComponents';
import { encryptData, decryptData, isEncrypted } from 'utils/encryption';

export const DataManagementTab = ({ onNavigate }) => {
  const { isDarkMode } = useTheme();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [exportPassword, setExportPassword] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');

  const handleExport = async () => {
    if (!exportPassword || exportPassword.trim() === '') {
      setStatusMessage('Enter your account password to encrypt your backup.');
      setTimeout(() => setStatusMessage(''), 5000);
      return;
    }

    try {
      const passwordValid = await apiService.verifyPassword(exportPassword);
      if (!passwordValid) {
        setStatusMessage('Incorrect password.');
        setTimeout(() => setStatusMessage(''), 5000);
        return;
      }

      const exportData = await apiService.exportData();
      const encrypted = await encryptData(exportData, exportPassword);
      const dataStr = JSON.stringify(encrypted, null, 2);
      const fileName = `tally-export-${new Date().toISOString().split('T')[0]}.tally`;
      const fileType = 'application/json';
      setStatusMessage('✓ Data exported successfully (encrypted)');

      // Create downloadable file
      const dataBlob = new Blob([dataStr], { type: fileType });

      // Create download link
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);
      setExportPassword(''); // Clear password after export

      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      console.error('❌ Failed to export data:', error);
      setStatusMessage(error.message || 'Failed to export data. Please try again.');
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
      // Check if file needs password (read first to check if encrypted)
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (isEncrypted(data)) {
            setNeedsPassword(true);
          } else {
            setNeedsPassword(false);
          }
          setShowImportModal(true);
        } catch (error) {
          console.error('Failed to read file:', error);
          setStatusMessage('Invalid file format');
          setTimeout(() => setStatusMessage(''), 5000);
        }
      };
      reader.readAsText(file);
    }
  };

  const confirmImport = () => {
    if (!importFile) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let importedData = JSON.parse(e.target.result);

        // If data is encrypted, decrypt it first
        if (isEncrypted(importedData)) {
          if (!importPassword || importPassword.trim() === '') {
            setStatusMessage('Password required for encrypted backup');
            setTimeout(() => setStatusMessage(''), 5000);
            return;
          }
          try {
            importedData = await decryptData(importedData, importPassword);
          } catch (decryptError) {
            console.error('Decryption failed:', decryptError);
            setStatusMessage(decryptError.message || 'Failed to decrypt. Check password.');
            setTimeout(() => setStatusMessage(''), 5000);
            return;
          }
        }

        await apiService.importData(importedData);
        setStatusMessage('✓ Data imported successfully');
        setTimeout(() => setStatusMessage(''), 3000);
        setShowImportModal(false);
        setImportFile(null);
        setImportPassword('');
        setNeedsPassword(false);
        // Reload page to reflect imported data
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        console.error('❌ Failed to import data:', error);
        setStatusMessage('Failed to import data. Invalid file format.');
        setTimeout(() => setStatusMessage(''), 5000);
        setShowImportModal(false);
        setImportFile(null);
        setImportPassword('');
        setNeedsPassword(false);
      }
    };
    reader.readAsText(importFile);
  };

  const handleReset = async () => {
    if (!resetPassword) {
      setResetError('Password is required');
      return;
    }

    try {
      const result = await apiService.resetAllData(resetPassword);
      setShowResetConfirm(false);
      setResetPassword('');
      setResetError('');

      // Check if account was deleted (new behavior)
      if (result?.data?.accountDeleted) {
        setStatusMessage('✓ All data and account deleted');
        // Clear session storage to ensure logout
        sessionStorage.removeItem('tally_session_active');
        setTimeout(() => {
          // Redirect to root - will show RegisterScreen
          window.location.href = '/';
        }, 1000);
      } else {
        // Old behavior: just reload
        setStatusMessage('✓ All data reset successfully');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Failed to reset data:', error);
      setResetError(error.message || 'Failed to reset data. Please try again.');
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
            Download all your data as an encrypted backup file.
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <input
              type="password"
              placeholder="Enter your account password"
              value={exportPassword}
              onChange={(e) => setExportPassword(e.target.value)}
              className={`w-full px-4 py-2 border-2 font-light bg-transparent ${
                isDarkMode
                  ? 'border-gray-700 text-white placeholder-gray-500'
                  : 'border-gray-300 text-black placeholder-gray-400'
              }`}
            />
            <div className={`text-xs font-light space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <p>
                Your backup is encrypted with the same password you log in with — nothing
                extra to remember. If you restore it on a fresh install (via "Import Existing
                Data" on the registration screen), this password becomes your login password
                there too.
              </p>
              <p className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>
                Uses AES-256-GCM encryption with Argon2id key derivation
              </p>
            </div>
          </div>
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
            accept=".json,.tally"
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
        description={
          needsPassword
            ? "This backup is encrypted. Enter the encryption password to decrypt and import."
            : "This will replace all your current data with the imported data. Make sure you have exported your current data first."
        }
        confirmText="Import"
        cancelText="Cancel"
        onConfirm={confirmImport}
        onCancel={() => {
          setShowImportModal(false);
          setImportFile(null);
          setImportPassword('');
          setNeedsPassword(false);
        }}
        confirmDanger={true}
      >
        {needsPassword && (
          <div className="mt-4 space-y-2">
            <input
              type="password"
              placeholder="Enter encryption password"
              value={importPassword}
              onChange={(e) => setImportPassword(e.target.value)}
              className={`w-full px-4 py-2 border-2 font-light bg-transparent ${
                isDarkMode
                  ? 'border-gray-700 text-white placeholder-gray-500'
                  : 'border-gray-300 text-black placeholder-gray-400'
              }`}
              autoFocus
            />
            <p className={`text-xs font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Enter the encryption password that was used when creating this backup
            </p>
          </div>
        )}
      </ConfirmationModal>

      {/* Reset Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResetConfirm}
        title="Reset All Data?"
        description="This will permanently delete all your data, including transactions, budgets, and settings, and delete your account. You'll need to register again to use Tally. This action cannot be undone."
        confirmText="Reset Everything"
        cancelText="Cancel"
        onConfirm={handleReset}
        onCancel={() => {
          setShowResetConfirm(false);
          setResetPassword('');
          setResetError('');
        }}
        confirmDanger={true}
      >
        <div className="space-y-2">
          <input
            type="password"
            placeholder="Enter your password to confirm"
            value={resetPassword}
            onChange={(e) => {
              setResetPassword(e.target.value);
              setResetError('');
            }}
            className={`w-full px-4 py-2 border-2 font-light bg-transparent ${
              isDarkMode
                ? 'border-gray-700 text-white placeholder-gray-500'
                : 'border-gray-300 text-black placeholder-gray-400'
            }`}
            autoFocus
          />
          {resetError && (
            <p className="text-sm font-light text-red-500">{resetError}</p>
          )}
        </div>
      </ConfirmationModal>
    </div>
  );
};
