import { useState } from 'react';

import { useAuth } from 'contexts/AuthContext';
import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';

export const LoginScreen = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { isDarkMode } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(password);
      // After login, AuthContext will update and App will automatically
      // show the main app (user will be authenticated)
      console.log('[LOGIN] Login successful, auth state will update');
    } catch (err) {
      console.error('[LOGIN] Login failed:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    } flex items-center justify-center p-8`}>

      {/* Theme Toggle */}
      <div className="fixed top-8 right-8 z-40">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-light leading-tight">
            Tally
          </h1>
          <p className={`text-xl font-light ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Enter your household password to continue
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label
              htmlFor="password"
              className={`block text-base font-light ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-12 border font-light transition-colors ${
                  isDarkMode
                    ? 'bg-black border-gray-800 text-white placeholder-gray-600 focus:border-gray-700'
                    : 'bg-white border-gray-300 text-black placeholder-gray-400 focus:border-gray-400'
                } focus:outline-none`}
                placeholder="Enter password"
                required
                disabled={isLoading}
                autoComplete="current-password"
                autoFocus
                aria-label="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                  isDarkMode
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-black'
                } focus:outline-none`}
                disabled={isLoading}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className={`p-4 border-l-4 ${
              isDarkMode
                ? 'bg-red-900/20 border-red-600 text-red-400'
                : 'bg-red-100 border-red-500 text-red-700'
            }`}>
              <p className="text-sm font-light">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            className={`w-full py-4 border-2 font-light text-lg transition-all ${
              isLoading || !password.trim()
                ? isDarkMode
                  ? 'border-gray-800 text-gray-600 cursor-not-allowed'
                  : 'border-gray-200 text-gray-400 cursor-not-allowed'
                : isDarkMode
                  ? 'border-white text-white hover:bg-white hover:text-black'
                  : 'border-black text-black hover:bg-black hover:text-white'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className={`w-5 h-5 border-2 ${
                  isDarkMode ? 'border-gray-600 border-t-white' : 'border-gray-400 border-t-black'
                } rounded-full animate-spin mr-2`}></div>
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="text-center">
          <p className={`text-sm font-light ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Self-hosted financial management
          </p>
        </div>
      </div>
    </div>
  );
};