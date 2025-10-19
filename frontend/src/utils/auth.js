const API_BASE = '/api';
const TOKEN_KEY = 'tally_auth_token';
const TOKEN_EXPIRES_KEY = 'tally_auth_expires';

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

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_EXPIRES_KEY, expires.toString());

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


    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRES_KEY);
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
    const token = localStorage.getItem(TOKEN_KEY);
    const expires = localStorage.getItem(TOKEN_EXPIRES_KEY);
    
    if (!token || !expires) {
      return null;
    }
    
    if (Date.now() > parseInt(expires)) {
      this.logout();
      return null;
    }
    
    return token;
  },

  isAuthenticated() {
    return this.getToken() !== null;
  },

  getAuthHeaders() {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  },
};