// RegisterScreen - First-time setup with password
import { useState } from 'react';

import { useAuth } from 'contexts/AuthContext';
import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { DateRangePicker } from 'components/shared/DateRangePicker';
import { ImportDataModal } from 'components/shared/ImportDataModal';
import { apiService } from 'utils/apiService';

export const RegisterScreen = () => {
  const { isDarkMode } = useTheme();
  const [householdName, setHouseholdName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [periodData, setPeriodData] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleDateRangeChange = (dateRange) => {
    setPeriodData(dateRange);
  };

  const handleImportSuccess = async () => {
    try {
      console.log('[RegisterScreen] Import success, loading user data for redirect...');
      const userData = await apiService.loadUserData();
      console.log('[RegisterScreen] User data loaded:', userData);

      if (!userData || !userData.household) {
        console.error('[RegisterScreen] No household data found after import');
        window.location.reload();
        return;
      }

      // Use same logic as AppRouter getHouseholdId()
      let householdId = userData.household.id;
      if (!householdId && userData.household.name) {
        householdId = `household-${userData.household.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        console.log('[RegisterScreen] Generated householdId from name:', householdId);
      }

      if (householdId) {
        console.log('[RegisterScreen] Redirecting to:', `/${householdId}/dashboard`);
        window.location.href = `/${householdId}/dashboard`;
      } else {
        console.error('[RegisterScreen] Could not determine householdId, reloading');
        window.location.reload();
      }
    } catch (error) {
      console.error('[RegisterScreen] Failed to load user data after import:', error);
      window.location.reload();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!periodData || !periodData.durationMonths || periodData.durationMonths < 1 || periodData.durationMonths > 12) {
      setError('Please select a valid budget period (1-12 months)');
      return;
    }

    setIsLoading(true);

    try {
      // Generate unique household ID
      const householdId = `household-${Date.now()}`;

      // Create initial household and period data
      const initialData = {
        household: {
          id: householdId,
          name: householdName,
          created_date: new Date().toISOString().split('T')[0]
        },
        period: {
          duration_months: periodData.durationMonths,
          start_date: periodData.startDate,
          end_date: periodData.endDate,
          period_number: 1
        },
        settings: {
          currency: 'USD'
        }
      };

      // Register user and save initial data
      await register(householdName, password, initialData);

      console.log('[REGISTER] Registration successful, auth state will update');
    } catch (err) {
      console.error('[REGISTER] Registration failed:', err);
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ThemeToggle />
      <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto px-8 py-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className={`text-5xl font-light mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Welcome to Tally
            </h1>
            <p className={`text-xl font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              A privacy-first approach to organizing your financial life. All data stays on your device.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-12">
            {/* Household Name */}
            <div>
              <label className={`block text-2xl font-light mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Your name(s)
              </label>
              <input
                type="text"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="John, Jane & John, Smith Family"
                className={`w-full text-2xl font-medium pb-4 border-b-2 bg-transparent transition-colors ${
                  isDarkMode
                    ? 'border-gray-800 text-white placeholder-gray-600 focus:border-white'
                    : 'border-gray-200 text-black placeholder-gray-400 focus:border-black'
                } focus:outline-none`}
                required
                autoFocus
              />
            </div>

            {/* Password Section */}
            <div className="space-y-8">
              <h2 className={`text-2xl font-light ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Set Your Password
              </h2>

              <div>
                <label className={`block text-xl font-light mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (min 6 characters)"
                  className={`w-full px-4 py-3 text-lg font-light border transition-colors ${
                    isDarkMode
                      ? 'bg-black border-gray-800 text-white hover:border-gray-600 focus:border-white placeholder-gray-600'
                      : 'bg-white border-gray-200 text-black hover:border-gray-400 focus:border-black placeholder-gray-400'
                  } focus:outline-none`}
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className={`block text-xl font-light mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className={`w-full px-4 py-3 text-lg font-light border transition-colors ${
                    isDarkMode
                      ? 'bg-black border-gray-800 text-white hover:border-gray-600 focus:border-white placeholder-gray-600'
                      : 'bg-white border-gray-200 text-black hover:border-gray-400 focus:border-black placeholder-gray-400'
                  } focus:outline-none`}
                  required
                />
              </div>
            </div>

            {/* Budget Period */}
            <div>
              <h2 className={`text-2xl font-light mb-6 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Your Budget Period (1-12 months)
              </h2>
              <DateRangePicker
                onDateRangeChange={handleDateRangeChange}
                maxMonths={12}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className={`p-4 border ${
                isDarkMode
                  ? 'bg-red-900/20 border-red-800 text-red-400'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading || !householdName.trim() || !password || !confirmPassword || !periodData}
                className={`w-full py-4 text-xl font-light transition-colors ${
                  isLoading || !householdName.trim() || !password || !confirmPassword || !periodData
                    ? isDarkMode
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : isDarkMode
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {isLoading ? 'Creating Account...' : 'Begin Financial Setup'}
              </button>
            </div>
          </form>

          {/* Import Existing Data Option */}
          <div className="mt-12 text-center">
            <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Already have Tally data?
            </p>
            <button
              onClick={() => setShowImportModal(true)}
              className={`text-sm font-medium px-6 py-2 border transition-colors ${
                isDarkMode
                  ? 'border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white'
                  : 'border-gray-300 text-gray-700 hover:border-gray-600 hover:text-black'
              }`}
            >
              Import Existing Data
            </button>
          </div>
        </div>
      </div>

      {/* Import Data Modal */}
      <ImportDataModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
      />
    </>
  );
};
