import { Auth } from './auth';

const API_BASE = '/api';

export const ContainerStorage = {
  async loadBudgetData() {
    try {
      const authHeaders = Auth.getAuthHeaders();
      if (import.meta.env.DEV) {
        console.log('🔑 Auth headers for budget load:', authHeaders.Authorization ? 'Token present' : 'NO TOKEN');
      }

      const response = await fetch(`${API_BASE}/budget`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('❌ 401 Unauthorized - token invalid or missing');
          throw new Error('Authentication required');
        }
        throw new Error('Failed to load budget data');
      }

      const data = await response.json();
      if (import.meta.env.DEV) {
        console.log('✅ Budget data loaded successfully');
      }
      return data;
    } catch (error) {
      console.error('Load budget data error:', error);
      throw error;
    }
  },

  async saveBudgetData(data) {
    try {
      const response = await fetch(`${API_BASE}/budget`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...Auth.getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error('Failed to save budget data');
      }

      return await response.json();
    } catch (error) {
      console.error('Save budget data error:', error);
      throw error;
    }
  },

  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (!response.ok) return false;

      // Verify it's actually JSON (not HTML from dev server)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return false;
      }

      // Verify the response has the expected structure
      const data = await response.json();
      return data && data.status === 'ok';
    } catch {
      return false;
    }
  },
};