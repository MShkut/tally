const API_BASE = '/api';

// Store auth token only in memory - no persistence
// Users must login every time they open/refresh the app
let authToken = null;
let tokenExpires = null;

export const Auth = {
  async login(password) {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          // Response body is not JSON or is empty
        }
        throw new Error(errorMessage);
      }

      const { token, expires } = await response.json();

      // Store in memory only
      authToken = token;
      tokenExpires = expires;

      // Clean up any old persisted tokens from previous versions
      localStorage.removeItem('tally_auth_token');
      localStorage.removeItem('tally_auth_expires');
      sessionStorage.removeItem('tally_auth_token');
      sessionStorage.removeItem('tally_auth_expires');

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async logout() {
    const token = this.getToken();

    if (token) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Logout request failed:', error);
        }
      }
    }

    // Clear in-memory token
    authToken = null;
    tokenExpires = null;

    // Clean up any old persisted tokens
    localStorage.removeItem('tally_auth_token');
    localStorage.removeItem('tally_auth_expires');
    sessionStorage.removeItem('tally_auth_token');
    sessionStorage.removeItem('tally_auth_expires');
  },

  async changePassword(currentPassword, newPassword) {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        let errorMessage = 'Password change failed';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          // Response body is not JSON or is empty
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      throw new Error(error.message);
    }
  },

  getToken() {
    if (!authToken || !tokenExpires) {
      return null;
    }

    // Check if token is expired
    if (Date.now() > parseInt(tokenExpires)) {
      this.logout();
      return null;
    }

    return authToken;
  },

  isAuthenticated() {
    return this.getToken() !== null;
  },

  getAuthHeaders() {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  },
};