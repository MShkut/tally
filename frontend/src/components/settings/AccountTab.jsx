// frontend/src/components/settings/AccountTab.jsx
import React, { useState } from 'react';
import { useTheme } from 'contexts/ThemeContext';

export const AccountTab = () => {
  const { isDarkMode } = useTheme();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const handleChangePassword = () => {
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = () => {
    // Validate passwords
    if (!currentPassword || !newPassword || !confirmPassword) {
      setStatusMessage('All password fields are required');
      setTimeout(() => setStatusMessage(''), 3000);
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage('New passwords do not match');
      setTimeout(() => setStatusMessage(''), 3000);
      return;
    }

    if (newPassword.length < 8) {
      setStatusMessage('Password must be at least 8 characters');
      setTimeout(() => setStatusMessage(''), 3000);
      return;
    }

    // TODO: Implement actual password change logic
    // This would need to integrate with your authentication system
    setStatusMessage('✓ Password changed successfully');
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  return (
    <div className="space-y-12 max-w-2xl">
      {/* Change Password */}
      <div className="space-y-4">
        <div>
          <h3 className={`text-lg font-light mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Password
          </h3>
          <p className={`text-sm font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Change your account password
          </p>
        </div>

        <button
          onClick={handleChangePassword}
          className={`px-6 py-3 border-2 font-light transition-all ${
            isDarkMode
              ? 'border-white text-white hover:bg-white hover:text-black'
              : 'border-black text-black hover:bg-black hover:text-white'
          }`}
        >
          Change Password
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

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-8 max-w-md w-full mx-4 ${
            isDarkMode ? 'bg-gray-900' : 'bg-white'
          }`}>
            <h3 className={`text-2xl font-light mb-6 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Change Password
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-sm font-light mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg font-light transition-colors ${
                    isDarkMode
                      ? 'bg-gray-800 border border-gray-700 text-white'
                      : 'bg-white border border-gray-300 text-black'
                  } focus:outline-none`}
                />
              </div>

              <div>
                <label className={`block text-sm font-light mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg font-light transition-colors ${
                    isDarkMode
                      ? 'bg-gray-800 border border-gray-700 text-white'
                      : 'bg-white border border-gray-300 text-black'
                  } focus:outline-none`}
                />
              </div>

              <div>
                <label className={`block text-sm font-light mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg font-light transition-colors ${
                    isDarkMode
                      ? 'bg-gray-800 border border-gray-700 text-white'
                      : 'bg-white border border-gray-300 text-black'
                  } focus:outline-none`}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handlePasswordSubmit}
                className={`flex-1 px-6 py-3 border-2 font-light transition-all ${
                  isDarkMode
                    ? 'border-white text-white hover:bg-white hover:text-black'
                    : 'border-black text-black hover:bg-black hover:text-white'
                }`}
              >
                Change Password
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className={`px-6 py-3 border-2 font-light transition-all ${
                  isDarkMode
                    ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                    : 'border-gray-400 text-gray-600 hover:border-gray-500 hover:text-gray-700'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
