// frontend/src/components/settings/AccountTab.jsx
import { useState, useEffect } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ChangePasswordModal } from 'components/shared/ChangePasswordModal';
import { apiService } from 'utils/apiService';

export const AccountTab = () => {
  const { isDarkMode } = useTheme();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [isEditingHousehold, setIsEditingHousehold] = useState(false);
  const [editedHouseholdName, setEditedHouseholdName] = useState('');

  // Load household name
  useEffect(() => {
    const loadHouseholdData = async () => {
      try {
        const userData = await apiService.loadUserData();
        if (userData?.household?.name) {
          setHouseholdName(userData.household.name);
        }
      } catch (error) {
        console.error('[AccountTab] Failed to load household data:', error);
      }
    };
    loadHouseholdData();
  }, []);

  const handlePasswordChangeSuccess = () => {
    setStatusMessage('✓ Password changed successfully');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleEditHousehold = () => {
    setEditedHouseholdName(householdName);
    setIsEditingHousehold(true);
  };

  const handleCancelEdit = () => {
    setIsEditingHousehold(false);
    setEditedHouseholdName('');
  };

  const handleSaveHousehold = async () => {
    try {
      // Load current user data
      const userData = await apiService.loadUserData();

      // Update household name
      const updatedData = {
        ...userData,
        household: {
          ...userData.household,
          name: editedHouseholdName
        }
      };

      // Save to backend
      await apiService.saveUserData(updatedData);

      // Update local state
      setHouseholdName(editedHouseholdName);
      setIsEditingHousehold(false);
      setStatusMessage('✓ Household name updated successfully');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      console.error('[AccountTab] Failed to update household name:', error);
      setStatusMessage('✗ Failed to update household name');
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  return (
    <>
      <div className="space-y-12 max-w-2xl">
        {/* Household Name */}
        <div className="space-y-4">
          <div>
            <h3 className={`text-lg font-light mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Household
            </h3>
            <p className={`text-sm font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Your household name
            </p>
          </div>

          {!isEditingHousehold ? (
            <>
              <div className={`text-xl font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                {householdName || 'Loading...'}
              </div>
              <button
                onClick={handleEditHousehold}
                className={`px-6 py-3 border-2 font-light transition-all ${
                  isDarkMode
                    ? 'border-white text-white hover:bg-white hover:text-black'
                    : 'border-black text-black hover:bg-black hover:text-white'
                }`}
              >
                Change Household Name
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                value={editedHouseholdName}
                onChange={(e) => setEditedHouseholdName(e.target.value)}
                className={`w-full px-4 py-3 border-2 font-light transition-colors ${
                  isDarkMode
                    ? 'bg-black border-gray-700 text-white focus:border-white'
                    : 'bg-white border-gray-300 text-black focus:border-black'
                } outline-none`}
                placeholder="Enter household name"
              />
              <div className="flex gap-4">
                <button
                  onClick={handleSaveHousehold}
                  disabled={!editedHouseholdName.trim()}
                  className={`px-6 py-3 border-2 font-light transition-all ${
                    isDarkMode
                      ? 'border-white text-white hover:bg-white hover:text-black disabled:border-gray-700 disabled:text-gray-700 disabled:hover:bg-transparent'
                      : 'border-black text-black hover:bg-black hover:text-white disabled:border-gray-300 disabled:text-gray-300 disabled:hover:bg-transparent'
                  }`}
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className={`px-6 py-3 border-2 font-light transition-all ${
                    isDarkMode
                      ? 'border-gray-700 text-gray-400 hover:bg-gray-900'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

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
            onClick={() => setShowPasswordModal(true)}
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
      </div>

      {/* Password Change Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordChangeSuccess}
      />
    </>
  );
};
